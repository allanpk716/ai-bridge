package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/session"
)

// PermissionHandler handles permission-related requests
type PermissionHandler struct {
	manager *session.Manager
}

// NewPermissionHandler creates a new permission handler
func NewPermissionHandler(manager *session.Manager) *PermissionHandler {
	return &PermissionHandler{
		manager: manager,
	}
}

// ApprovePermission approves a permission request
// POST /api/v1/sessions/:sessionId/permissions/:requestId/approve
func (h *PermissionHandler) ApprovePermission(c *gin.Context) {
	sessionID := c.Param("sessionId")
	requestID := c.Param("requestId")

	var req struct {
		Scope string `json:"scope"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Get process and send approval
	instance := sess.GetProcess()
	proc := instance.GetProcess()
	if err := proc.SendApproval(c.Request.Context(), requestID, true, req.Scope); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requestId": requestID,
		"approved":  true,
		"scope":     req.Scope,
	})
}

// DenyPermission denies a permission request
// POST /api/v1/sessions/:sessionId/permissions/:requestId/deny
func (h *PermissionHandler) DenyPermission(c *gin.Context) {
	sessionID := c.Param("sessionId")
	requestID := c.Param("requestId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Get process and send denial
	instance := sess.GetProcess()
	proc := instance.GetProcess()
	if err := proc.SendApproval(c.Request.Context(), requestID, false, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requestId": requestID,
		"approved":  false,
	})
}
