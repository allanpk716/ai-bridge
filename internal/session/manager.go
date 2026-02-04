package session

import (
	"context"

	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/pool"
)

// Manager manages sessions
type Manager struct {
	config     config.SessionConfig
	pool       *pool.Pool
}

// NewManager creates a new session manager
func NewManager(cfg config.SessionConfig, p *pool.Pool) *Manager {
	return &Manager{
		config: cfg,
		pool:   p,
	}
}

// Shutdown gracefully shuts down the session manager
func (m *Manager) Shutdown(ctx context.Context) error {
	// TODO: Implement manager shutdown
	return nil
}
