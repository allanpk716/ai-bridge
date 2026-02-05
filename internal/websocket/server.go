package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/your-org/ai-bridge/internal/session"
	"github.com/WQGroup/logger"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: Check origin in production
	},
}

// Server represents the WebSocket server
type Server struct {
	manager        *Manager
	sessionManager *session.Manager
}

// NewServer creates a new WebSocket server
func NewServer(sessionManager *session.Manager) *Server {
	return &Server{
		manager:        NewManager(),
		sessionManager: sessionManager,
	}
}

// HandleWebSocket handles WebSocket connection requests
func (s *Server) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get session ID from query
	sessionID := r.URL.Query().Get("sessionId")
	if sessionID == "" {
		http.Error(w, "sessionId required", http.StatusBadRequest)
		return
	}

	// Verify session
	sess, err := s.sessionManager.GetSession(sessionID)
	if err != nil {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Errorf("WebSocket upgrade failed: %v", err)
		return
	}

	// Create client
	client := &Client{
		ID:        fmt.Sprintf("ws-%d", time.Now().UnixNano()),
		SessionID: sessionID,
		Conn:      conn,
		Send:      make(chan []byte, 256),
	}

	s.manager.AddClient(client)

	// Start read and write pumps
	go s.readPump(client)
	go s.writePump(client)

	// Subscribe to session messages
	filter := session.MessageFilter{}
	msgChan, cancel := sess.Subscribe(r.Context(), filter)

	// Forward messages to client
	go func() {
		defer cancel()

		for msg := range msgChan {
			data, _ := json.Marshal(msg)
			s.manager.BroadcastToSession(sessionID, data)
		}
	}()
}

// readPump pumps messages from the WebSocket connection
func (s *Server) readPump(client *Client) {
	defer func() {
		s.manager.RemoveClient(client.ID)
		client.Conn.Close()
	}()

	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Errorf("WebSocket error: %v", err)
			}
			break
		}

		// Handle client messages (like heartbeat)
		logger.Debugf("WebSocket message from %s: %s", client.ID, message)
	}
}

// writePump pumps messages to the WebSocket connection
func (s *Server) writePump(client *Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			client.Conn.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
