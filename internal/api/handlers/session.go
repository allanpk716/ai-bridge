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
	var req struct {
		WorkingDir     string   `json:"workingDirectory" binding:"required"`
		Model          string   `json:"model,omitempty"`
		Agent          string   `json:"agent,omitempty"`
		PermissionMode string   `json:"permissionMode,omitempty"`
		AllowedTools   []string `json:"allowedTools,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sess, err := h.manager.CreateSession(c.Request.Context(), session.CreateOptions{
		WorkingDir:     req.WorkingDir,
		Model:          req.Model,
		Agent:          req.Agent,
		PermissionMode: req.PermissionMode,
		AllowedTools:   req.AllowedTools,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := sess.GetStatus()

	c.JSON(http.StatusCreated, gin.H{
		"id":        sess.ID(),
		"status":    "created",
		"createdAt": status.StartTime,
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
	c.JSON(http.StatusOK, gin.H{
		"id":       sess.ID(),
		"status":   status,
		"metadata": status.Metadata,
	})
}

// ListSessions lists all sessions
func (h *SessionHandler) ListSessions(c *gin.Context) {
	sessions := h.manager.ListSessions()
	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
	})
}

// CloseSession closes a session
func (h *SessionHandler) CloseSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	if err := h.manager.CloseSession(sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":     sessionID,
		"status": "closed",
	})
}

// GetSessionStatus retrieves session status
func (h *SessionHandler) GetSessionStatus(c *gin.Context) {
	sessionID := c.Param("sessionId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	status := sess.GetStatus()
	c.JSON(http.StatusOK, status)
}

// StopSession stops a running session
func (h *SessionHandler) StopSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if err := sess.Stop(c.Request.Context()); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":     sessionID,
		"status": "stopped",
	})
}
