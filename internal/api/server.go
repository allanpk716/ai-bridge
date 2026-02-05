package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/api/handlers"
	"github.com/your-org/ai-bridge/internal/commands"
	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/health"
	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/internal/session"
	"github.com/your-org/ai-bridge/internal/websocket"
	"github.com/WQGroup/logger"
)

// Server represents the HTTP API server
type Server struct {
	config        *config.Config
	sessionMgr    *session.Manager
	pool          *pool.Pool
	healthChecker *health.Checker
	router        *gin.Engine
	httpServer    *http.Server

	sessionHandler   *handlers.SessionHandler
	messageHandler   *handlers.MessageHandler
	permissionHandler *handlers.PermissionHandler
	wsServer         *websocket.Server
	commandHandler   *handlers.CommandHandler
	commandParser    *commands.Parser
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, sm *session.Manager, p *pool.Pool, hc *health.Checker) *Server {
	// Set gin mode based on log level
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Initialize command discovery
	homeDir := os.Getenv("HOME")
	if homeDir == "" {
		homeDir = os.Getenv("USERPROFILE") // Windows
	}

	discoverer := commands.NewDiscoverer(cfg.Server.WorkingDir, homeDir)
	cmds, _ := discoverer.DiscoverAll()
	parser := commands.NewParser(cmds)

	s := &Server{
		config:           cfg,
		sessionMgr:       sm,
		pool:             p,
		healthChecker:    hc,
		router:           router,
		sessionHandler:   handlers.NewSessionHandler(sm),
		messageHandler:   handlers.NewMessageHandler(sm),
		permissionHandler: handlers.NewPermissionHandler(sm),
		wsServer:         websocket.NewServer(sm),
		commandHandler:   handlers.NewCommandHandler(sm, parser),
		commandParser:    parser,
	}

	s.setupMiddleware()
	s.setupRoutes()

	return s
}

// loggerMiddleware logs all requests
func (s *Server) loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logger.Infof("[%s] %s %s | %d | %v",
			c.Request.Method,
			path,
			query,
			status,
			latency,
		)

		// Log errors
		if len(c.Errors) > 0 {
			for _, e := range c.Errors {
				logger.Errorf("Request error: %v", e.Error())
			}
		}
	}
}

// corsMiddleware handles CORS
func (s *Server) corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range s.config.CORS.Origins {
			if origin == allowedOrigin || allowedOrigin == "*" {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
			c.Header("Access-Control-Expose-Headers", "Content-Length")
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// setupMiddleware sets up middleware
func (s *Server) setupMiddleware() {
	s.router.Use(gin.Recovery())
	s.router.Use(s.loggerMiddleware())
	s.router.Use(s.corsMiddleware())
}

// setupRoutes sets up all routes
func (s *Server) setupRoutes() {
	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Unix(),
		})
	})

	// WebSocket endpoint
	s.router.GET("/ws", func(c *gin.Context) {
		s.wsServer.HandleWebSocket(c.Writer, c.Request)
	})

	// API v1
	v1 := s.router.Group("/api/v1")
	{
		// Session management
		sessions := v1.Group("/sessions")
		{
			sessions.POST("", s.sessionHandler.CreateSession)
			sessions.GET("", s.sessionHandler.ListSessions)
			sessions.GET("/:sessionId", s.sessionHandler.GetSession)
			sessions.DELETE("/:sessionId", s.sessionHandler.CloseSession)
			sessions.GET("/:sessionId/status", s.sessionHandler.GetSessionStatus)
			sessions.POST("/:sessionId/stop", s.sessionHandler.StopSession)
		}

		// Message management
		messages := v1.Group("/sessions/:sessionId/messages")
		{
			messages.GET("", s.messageHandler.GetMessages)
			messages.GET("/stream", s.messageHandler.StreamMessages)
			messages.POST("", s.messageHandler.SendMessage)
		}

		// Permission management
		permissions := v1.Group("/sessions/:sessionId/permissions")
		{
			permissions.POST("/:requestId/approve", s.permissionHandler.ApprovePermission)
			permissions.POST("/:requestId/deny", s.permissionHandler.DenyPermission)
		}

		// Slash commands
		commands := v1.Group("/commands")
		{
			commands.GET("", s.commandHandler.ListCommands)
			commands.GET("/*path", s.commandHandler.GetCommand)
		}
		sessions.POST("/:sessionId/commands", s.commandHandler.ExecuteCommand)
	}
}

// SetCommandParser sets the command parser (called after initialization)
// TODO: Implement in Task 10
// func (s *Server) SetCommandParser(parser *commands.Parser) {
//     s.commandParser = parser
//     s.commandHandler = handlers.NewCommandHandler(s.sessionMgr, parser)
// }

// Start starts the HTTP server
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)

	s.httpServer = &http.Server{
		Addr:           addr,
		Handler:        s.router,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	logger.Infof("HTTP server listening on %s", addr)

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	logger.Info("Shutting down HTTP server...")

	if s.httpServer != nil {
		return s.httpServer.Shutdown(ctx)
	}

	return nil
}
