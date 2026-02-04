package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/session"
)

// SessionHandler handles session-related requests
type SessionHandler struct {
	manager *session.Manager
}

// NewSessionHandler creates a new session handler
func NewSessionHandler(manager *session.Manager) *SessionHandler {
	return &SessionHandler{
		manager: manager,
	}
}

// CreateSession creates a new session
func (h *SessionHandler) CreateSession(c *gin.Context) {
	sess, err := h.manager.CreateSession(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"sessionId":  sess.ID(),
		"status":     "idle",
		"createdAt":  "2024-01-01T00:00:00Z",
	})
}

// GetSession retrieves a session
func (h *SessionHandler) GetSession(c *gin.Context) {
	sessionID := c.Param("sessionId")
	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	status := sess.GetStatus()
	c.JSON(http.StatusOK, status)
}

// ListSessions lists all sessions
func (h *SessionHandler) ListSessions(c *gin.Context) {
	sessions := h.manager.ListSessions()
	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
	})
}
