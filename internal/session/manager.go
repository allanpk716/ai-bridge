package session

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/WQGroup/logger"
)

// Manager manages sessions
type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	pool     *pool.Pool
	store    *SessionStore
	config   config.SessionConfig

	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	closeOnce sync.Once
}

// NewManager creates a new session manager
func NewManager(cfg config.SessionConfig, pool *pool.Pool) (*Manager, error) {
	// Initialize store
	store, err := NewSessionStore("./data/sessions.db")
	if err != nil {
		return nil, fmt.Errorf("failed to create session store: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	mgr := &Manager{
		sessions: make(map[string]*Session),
		pool:     pool,
		store:    store,
		config:   cfg,
		ctx:      ctx,
		cancel:   cancel,
	}

	// Start cleanup goroutine
	mgr.wg.Add(1)
	go mgr.cleanupLoop()

	logger.Info("Session manager initialized")
	return mgr, nil
}

// CreateOptions options for creating a session
type CreateOptions struct {
	WorkingDir     string
	Model          string
	Agent          string
	PermissionMode string
	AllowedTools   []string
}

// CreateSession creates a new session
func (m *Manager) CreateSession(ctx context.Context, opts CreateOptions) (*Session, error) {
	// Acquire instance from pool
	instance, err := m.pool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to acquire instance: %w", err)
	}

	// Generate session ID
	sessionID := fmt.Sprintf("sess-%d", time.Now().UnixNano())

	// Create session
	sessCfg := SessionConfig{
		MaxRecentMessages: m.config.MaxRecentMessages,
		MessageBufferSize: 100,
	}

	sess := NewSession(sessionID, instance, m.store, sessCfg)

	// Store in database
	sessDB := &SessionDB{
		SessionID:  sessionID,
		Status:     string(StateIdle),
		WorkingDir: "", // TODO: get from instance
		Model:      "", // TODO: get from config
	}

	if err := m.store.CreateSession(sessDB); err != nil {
		// Release instance on failure
		m.pool.Release(instance)
		return nil, fmt.Errorf("failed to store session: %w", err)
	}

	// Add to manager
	m.mu.Lock()
	m.sessions[sessionID] = sess
	m.mu.Unlock()

	// Start the session
	logger.Infof("Starting session %s...", sessionID)
	if err := sess.Start(); err != nil {
		logger.Errorf("Failed to start session %s: %v", sessionID, err)
		// Clean up failed session
		m.mu.Lock()
		delete(m.sessions, sessionID)
		m.mu.Unlock()

		m.pool.Release(instance)
		m.store.DeleteSession(sessionID)

		return nil, fmt.Errorf("failed to start session: %w", err)
	}

	logger.Infof("Session %s created", sessionID)
	return sess, nil
}

// GetSession retrieves a session by ID
func (m *Manager) GetSession(sessionID string) (*Session, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sess, exists := m.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session not found: %s", sessionID)
	}

	return sess, nil
}

// CloseSession closes a session
func (m *Manager) CloseSession(sessionID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	sess, exists := m.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	// Close session
	if err := sess.Close(); err != nil {
		return fmt.Errorf("failed to close session: %w", err)
	}

	// Release instance back to pool
	m.pool.Release(sess.instance)

	// Remove from manager
	delete(m.sessions, sessionID)

	// Update database
	if err := m.store.DeleteSession(sessionID); err != nil {
		logger.Errorf("Failed to delete session from store: %v", err)
	}

	logger.Infof("Session %s closed", sessionID)
	return nil
}

// ListSessions returns all active sessions
func (m *Manager) ListSessions() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sessionIDs := make([]string, 0, len(m.sessions))
	for id := range m.sessions {
		sessionIDs = append(sessionIDs, id)
	}

	return sessionIDs
}

// Shutdown gracefully shuts down the manager
func (m *Manager) Shutdown(ctx context.Context) error {
	m.closeOnce.Do(func() {
		logger.Info("Shutting down session manager...")

		// Stop cleanup goroutine
		m.cancel()
		m.wg.Wait()

		// Close all sessions
		m.mu.Lock()
		defer m.mu.Unlock()

		for sessionID, sess := range m.sessions {
			if err := sess.Close(); err != nil {
				logger.Errorf("Failed to close session %s: %v", sessionID, err)
			}
			m.pool.Release(sess.instance)
		}

		m.sessions = make(map[string]*Session)

		// Close store
		if err := m.store.Close(); err != nil {
			logger.Errorf("Failed to close session store: %v", err)
		}

		logger.Info("Session manager shutdown complete")
	})

	return nil
}

// cleanupLoop periodically cleans up idle sessions
func (m *Manager) cleanupLoop() {
	defer m.wg.Done()

	if m.config.CleanupInterval <= 0 {
		return
	}

	ticker := time.NewTicker(m.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.cleanupIdleSessions()
		}
	}
}

// cleanupIdleSessions removes idle sessions
func (m *Manager) cleanupIdleSessions() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.config.SessionTimeout <= 0 {
		return
	}

	now := time.Now()
	var toClose []string

	for sessionID, sess := range m.sessions {
		idleTime := now.Sub(sess.lastActivity)
		if idleTime > m.config.SessionTimeout {
			toClose = append(toClose, sessionID)
		}
	}

	// Close idle sessions
	for _, sessionID := range toClose {
		sess := m.sessions[sessionID]
		logger.Infof("Closing idle session %s (idle for %v)", sessionID, now.Sub(sess.lastActivity))

		if err := sess.Close(); err != nil {
			logger.Errorf("Failed to close idle session %s: %v", sessionID, err)
		}

		m.pool.Release(sess.instance)
		delete(m.sessions, sessionID)

		if err := m.store.DeleteSession(sessionID); err != nil {
			logger.Errorf("Failed to delete session from store: %v", err)
		}
	}

	if len(toClose) > 0 {
		logger.Infof("Cleaned up %d idle sessions (remaining: %d)", len(toClose), len(m.sessions))
	}
}
