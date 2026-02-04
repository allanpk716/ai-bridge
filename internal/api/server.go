package api

import (
	"net/http"

	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/health"
	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/internal/session"
)

// Server represents the HTTP API server
type Server struct {
	config        *config.Config
	sessionMgr    *session.Manager
	pool          *pool.Pool
	healthChecker *health.Checker
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, sm *session.Manager, p *pool.Pool, hc *health.Checker) *Server {
	return &Server{
		config:        cfg,
		sessionMgr:    sm,
		pool:          p,
		healthChecker: hc,
	}
}

// RegisterRoutes registers all API routes
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	// API routes will be registered here
	// TODO: Implement API routes
}
