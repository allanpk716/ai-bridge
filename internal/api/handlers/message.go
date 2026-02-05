package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/your-org/ai-bridge/internal/session"
)

// MessageHandler handles message-related requests
type MessageHandler struct {
	manager *session.Manager
}

// NewMessageHandler creates a new message handler
func NewMessageHandler(manager *session.Manager) *MessageHandler {
	return &MessageHandler{
		manager: manager,
	}
}

// SendMessage sends a message to a session
func (h *MessageHandler) SendMessage(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var req struct {
		Content string `json:"content" binding:"required"`
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

	if err := sess.SendMessage(c.Request.Context(), req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "sent",
	})
}

// GetMessages retrieves messages from a session
func (h *MessageHandler) GetMessages(c *gin.Context) {
	sessionID := c.Param("sessionId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Parse query parameters
	sinceSeq, _ := strconv.ParseInt(c.Query("since"), 10, 64)
	beforeSeq, _ := strconv.ParseInt(c.Query("before"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))

	if limit == 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	opts := session.GetMessagesOptions{
		SinceSeq:  sinceSeq,
		BeforeSeq: beforeSeq,
		Limit:     limit,
	}

	messages, err := sess.GetMessages(opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"since":    sinceSeq,
	})
}

// StreamMessages streams messages using SSE
func (h *MessageHandler) StreamMessages(c *gin.Context) {
	sessionID := c.Param("sessionId")

	sess, err := h.manager.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Parse since parameter
	sinceSeq, _ := strconv.ParseInt(c.Query("since"), 10, 64)

	// Subscribe to messages
	filter := session.MessageFilter{
		SinceSeq: sinceSeq,
	}

	msgChan, cancel := sess.Subscribe(c.Request.Context(), filter)
	defer cancel()

	// Stream messages
	c.Stream(func(w io.Writer) bool {
		select {
		case msg := <-msgChan:
			// Send SSE format
			data, _ := json.Marshal(msg)
			fmt.Fprintf(w, "data: %s\n\n", string(data))
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}
