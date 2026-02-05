package session

import (
	"context"
	"sync"
	"time"

	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/pkg/protocol"
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
}

// SessionState represents session state
type SessionState string

const (
	StateIdle       SessionState = "idle"
	StateProcessing SessionState = "processing"
)

// SessionConfig session configuration
type SessionConfig struct {
	MaxRecentMessages int
	MessageBufferSize int
}

// NewSession creates a new session
func NewSession(id string, instance *pool.Instance, store *SessionStore, cfg SessionConfig) *Session {
	ctx, cancel := context.WithCancel(context.Background())
	return &Session{
		id:          id,
		instance:    instance,
		store:       store,
		status:      StateIdle,
		messages:     make([]*protocol.Message, 0),
		createdAt:    time.Now(),
		lastActivity: time.Now(),
		ctx:          ctx,
		cancel:      cancel,
	}
}

func (s *Session) ID() string {
	return s.id
}

func (s *Session) Close() error {
	s.cancel()
	return nil
}

func (s *Session) GetStatus() protocol.SessionStatus {
	return protocol.SessionStatus{
		SessionID: s.id,
	}
}

func (s *Session) SendMessage(ctx context.Context, content string) error {
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

	cancel := func() {
		close(msgChan)
	}

	// Watch context
	go func() {
		<-ctx.Done()
		cancel()
	}()

	return msgChan, cancel
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
