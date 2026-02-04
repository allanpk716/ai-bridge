package api

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/api/handlers"
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
	router        *gin.Engine

	sessionHandler *handlers.SessionHandler
	messageHandler *handlers.MessageHandler
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, sm *session.Manager, p *pool.Pool, hc *health.Checker) *Server {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	return &Server{
		config:         cfg,
		sessionMgr:     sm,
		pool:           p,
		healthChecker:  hc,
		router:         router,
		sessionHandler: handlers.NewSessionHandler(sm),
		messageHandler: handlers.NewMessageHandler(sm),
	}
}

// RegisterRoutes registers all API routes
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	// Session routes
	api := s.router.Group("/api/v1")
	{
		// Sessions
		api.POST("/sessions", s.sessionHandler.CreateSession)
		api.GET("/sessions/:sessionId", s.sessionHandler.GetSession)
		api.GET("/sessions", s.sessionHandler.ListSessions)

		// Messages
		api.POST("/sessions/:sessionId/messages", s.messageHandler.SendMessage)
		api.GET("/sessions/:sessionId/messages", s.messageHandler.GetMessages)
	}

	// Register gin router with mux
	mux.Handle("/", s.router)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	return s.router.Run(":8080")
}

// Shutdown stops the HTTP server
func (s *Server) Shutdown(ctx context.Context) error {
	// TODO: Implement graceful shutdown
	return nil
}
