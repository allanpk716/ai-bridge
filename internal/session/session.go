package session

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/pkg/protocol"
	"github.com/WQGroup/logger"
)

// Session represents a Claude CLI session
type Session struct {
	id         string
	instance   *pool.Instance
	store      *SessionStore
	status     SessionState
	mu         sync.RWMutex
	messages     []*protocol.Message
	lastSeq      int64
	createdAt    time.Time
	lastActivity time.Time
	ctx          context.Context
	cancel     context.CancelFunc

	// New fields for message processing
	wg               sync.WaitGroup
	subscribers      []*subscriber
	subscriberMu     sync.RWMutex
	maxRecentMessages int
}

// SessionState represents session state
type SessionState string

const (
	StateIdle       SessionState = "idle"
	StateProcessing SessionState = "processing"
	StateError      SessionState = "error"
	StateStopped    SessionState = "stopped"
)

// subscriber represents a message subscriber
type subscriber struct {
	msgChan chan<- *protocol.Message
	filter  MessageFilter
	ctx     context.Context
}

// SessionConfig session configuration
type SessionConfig struct {
	MaxRecentMessages int
	MessageBufferSize int
}

// NewSession creates a new session
func NewSession(id string, instance *pool.Instance, store *SessionStore, cfg SessionConfig) *Session {
	ctx, cancel := context.WithCancel(context.Background())
	return &Session{
		id:                id,
		instance:          instance,
		store:             store,
		status:            StateIdle,
		messages:          make([]*protocol.Message, 0),
		createdAt:         time.Now(),
		lastActivity:      time.Now(),
		ctx:               ctx,
		cancel:            cancel,
		subscribers:       make([]*subscriber, 0),
		maxRecentMessages: cfg.MaxRecentMessages,
	}
}

func (s *Session) ID() string {
	return s.id
}

// Start starts the session message processing
func (s *Session) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	logger.Infof("Session.Start() called for %s, current status: %s", s.id, s.status)

	if s.status == StateProcessing {
		return fmt.Errorf("session already started")
	}

	// Get process
	process := s.instance.GetProcess()
	if process == nil {
		logger.Errorf("Session %s: process is nil!", s.id)
		return fmt.Errorf("process not available")
	}

	logger.Infof("Session %s: got process %s, starting watchMessages goroutine", s.id, process.ID())

	// Start message listening goroutine
	s.wg.Add(1)
	go s.watchMessages()

	s.status = StateProcessing
	logger.Infof("Session %s started", s.id)
	return nil
}

// watchMessages watches messages from process and handles them
func (s *Session) watchMessages() {
	defer s.wg.Done()

	process := s.instance.GetProcess()
	if process == nil {
		logger.Errorf("Session %s: process is nil, cannot watch messages", s.id)
		return
	}

	msgChan := process.MessageChannel()

	logger.Infof("Session %s: watching messages from process %s", s.id, process.ID())

	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				logger.Infof("Session %s: message channel closed", s.id)
				return
			}

			// Handle message (pass pointer)
			s.handleMessage(&msg)

		case <-s.ctx.Done():
			logger.Infof("Session %s: watchMessages stopped", s.id)
			return
		}
	}
}

// handleMessage handles a single message
func (s *Session) handleMessage(msg *protocol.Message) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Update lastSeq
	if msg.Seq > s.lastSeq {
		s.lastSeq = msg.Seq
	}

	// 2. Add to memory cache (keep only maxRecentMessages)
	s.messages = append(s.messages, msg)
	if len(s.messages) > s.maxRecentMessages {
		s.messages = s.messages[len(s.messages)-s.maxRecentMessages:]
	}

	// 3. Update activity time
	s.lastActivity = time.Now()

	// 4. Async save to database
	go s.saveMessageToDB(msg)

	// 5. Notify subscribers
	s.notifySubscribers(msg)

	logger.Debugf("Session %s: handled message seq=%d type=%s", s.id, msg.Seq, msg.Type)
}

// saveMessageToDB saves a message to database
func (s *Session) saveMessageToDB(msg *protocol.Message) {
	// Convert to MessageDB
	msgDB := &MessageDB{
		SessionID: s.id,
		Seq:       msg.Seq,
		Type:      string(msg.Type),
		Timestamp: msg.Timestamp.Unix(),
	}

	// Serialize Content (may be string or object)
	contentBytes, err := json.Marshal(msg.Content)
	if err != nil {
		logger.Errorf("Session %s: failed to marshal message content: %v", s.id, err)
		return
	}
	msgDB.Content = string(contentBytes)

	// Write to database
	if err := s.store.BatchWriteMessages([]*MessageDB{msgDB}); err != nil {
		logger.Errorf("Session %s: failed to save message to DB: %v", s.id, err)
	}
}

// notifySubscribers sends message to all subscribers
func (s *Session) notifySubscribers(msg *protocol.Message) {
	s.subscriberMu.RLock()
	defer s.subscriberMu.RUnlock()

	for _, sub := range s.subscribers {
		// Apply filter conditions
		if sub.filter.SinceSeq > 0 && msg.Seq <= sub.filter.SinceSeq {
			continue
		}

		if len(sub.filter.Types) > 0 {
			typeMatched := false
			for _, t := range sub.filter.Types {
				if t == string(msg.Type) {
					typeMatched = true
					break
				}
			}
			if !typeMatched {
				continue
			}
		}

		// Non-blocking send
		select {
		case sub.msgChan <- msg:
		case <-sub.ctx.Done():
			// Subscriber cancelled
		default:
			logger.Warnf("Session %s: subscriber channel full, dropping message", s.id)
		}
	}
}

func (s *Session) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Cancel context
	s.cancel()

	// Wait for all goroutines to complete
	s.wg.Wait()

	// Close all subscribers
	s.subscriberMu.Lock()
	for _, sub := range s.subscribers {
		close(sub.msgChan)
	}
	s.subscribers = nil
	s.subscriberMu.Unlock()

	s.status = StateStopped
	logger.Infof("Session %s closed", s.id)
	return nil
}

func (s *Session) GetStatus() protocol.SessionStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return protocol.SessionStatus{
		SessionID:      s.id,
		State:          protocol.SessionState(s.status),
		StartTime:      s.createdAt.Unix(),
		LastMessageSeq: s.lastSeq,
		TotalMessages:  int64(len(s.messages)),
	}
}

func (s *Session) SendMessage(ctx context.Context, content string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Get process
	process := s.instance.GetProcess()
	if process == nil {
		return fmt.Errorf("process not available")
	}

	// Update status
	s.status = StateProcessing
	s.lastActivity = time.Now()

	// Send message
	if err := process.SendMessage(ctx, content); err != nil {
		s.status = StateError
		return fmt.Errorf("failed to send message: %w", err)
	}

	logger.Infof("Session %s: sent user message", s.id)
	return nil
}

func (s *Session) GetMessages(opts GetMessagesOptions) ([]*protocol.Message, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*protocol.Message
	for _, msg := range s.messages {
		if msg.Seq > opts.SinceSeq {
			result = append(result, msg)
		}
	}

	if opts.Limit > 0 && len(result) > opts.Limit {
		result = result[:opts.Limit]
	}

	return result, nil
}

// GetProcess returns the underlying process instance
func (s *Session) GetProcess() *pool.Instance {
	return s.instance
}

// Subscribe subscribes to messages with filtering
func (s *Session) Subscribe(ctx context.Context, filter MessageFilter) (<-chan *protocol.Message, func()) {
	msgChan := make(chan *protocol.Message, 50)

	sub := &subscriber{
		msgChan: msgChan,
		filter:  filter,
		ctx:     ctx,
	}

	// Register subscriber
	s.subscriberMu.Lock()
	s.subscribers = append(s.subscribers, sub)
	s.subscriberMu.Unlock()

	// Cancel function
	cancel := func() {
		s.removeSubscriber(sub)
		close(msgChan)
	}

	// Listen for context cancellation
	go func() {
		<-ctx.Done()
		cancel()
	}()

	return msgChan, cancel
}

// removeSubscriber removes a subscriber
func (s *Session) removeSubscriber(sub *subscriber) {
	s.subscriberMu.Lock()
	defer s.subscriberMu.Unlock()

	for i, existing := range s.subscribers {
		if existing == sub {
			s.subscribers = append(s.subscribers[:i], s.subscribers[i+1:]...)
			break
		}
	}
}

// Stop stops the session
func (s *Session) Stop(ctx context.Context) error {
	return s.Close()
}

// MessageFilter filters messages
type MessageFilter struct {
	SinceSeq int64
	Types    []string
	Limit    int
}
