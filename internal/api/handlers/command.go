package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/commands"
	"github.com/your-org/ai-bridge/internal/session"
)

// CommandHandler handles command-related requests
type CommandHandler struct {
	manager       *session.Manager
	commandParser *commands.Parser
}

// NewCommandHandler creates a new command handler
func NewCommandHandler(manager *session.Manager, parser *commands.Parser) *CommandHandler {
	return &CommandHandler{
		manager:       manager,
		commandParser: parser,
	}
}

// ListCommands lists all available commands
// GET /api/v1/commands?sessionId=:id
func (h *CommandHandler) ListCommands(c *gin.Context) {
	groups := h.commandParser.GroupByCategory()

	c.JSON(http.StatusOK, gin.H{
		"byCategory": groups,
	})
}

// GetCommand retrieves a single command
// GET /api/v1/commands/*path
func (h *CommandHandler) GetCommand(c *gin.Context) {
	path := c.Param("path")

	// Ensure path starts with /
	if path != "" && path[0] != '/' {
		path = "/" + path
	}

	// Find command
	cmd, ok := h.commandParser.GetCommand(path)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Command not found"})
		return
	}

	c.JSON(http.StatusOK, cmd)
}

// ExecuteCommand executes a slash command
// POST /api/v1/sessions/:sessionId/commands
func (h *CommandHandler) ExecuteCommand(c *gin.Context) {
	sessionID := c.Param("sessionId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	var req struct {
		Command string `json:"command" binding:"required"`
		Args    string `json:"args,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build full command string
	cmd := req.Command
	if req.Args != "" {
		cmd = cmd + " " + req.Args
	}

	// Send to process
	instance := sess.GetProcess()
	proc := instance.GetProcess()
	if err := proc.SendMessage(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"status":  "executing",
		"command": req.Command,
	})
}
