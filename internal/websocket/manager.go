package websocket

import (
	"sync"

	"github.com/WQGroup/logger"
	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client
type Client struct {
	ID        string
	SessionID string
	Conn      *websocket.Conn
	Send      chan []byte
	mu        sync.Mutex
}

// Manager manages WebSocket connections
type Manager struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

// NewManager creates a new connection manager
func NewManager() *Manager {
	return &Manager{
		clients: make(map[string]*Client),
	}
}

// AddClient adds a client
func (m *Manager) AddClient(client *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.clients[client.ID] = client
	logger.Infof("WebSocket client added: %s (session: %s)", client.ID, client.SessionID)
}

// RemoveClient removes a client
func (m *Manager) RemoveClient(clientID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if client, ok := m.clients[clientID]; ok {
		close(client.Send)
		delete(m.clients, clientID)
		logger.Infof("WebSocket client removed: %s", clientID)
	}
}

// GetClient retrieves a client
func (m *Manager) GetClient(clientID string) (*Client, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	client, ok := m.clients[clientID]
	return client, ok
}

// GetClientsBySession returns all clients for a session
func (m *Manager) GetClientsBySession(sessionID string) []*Client {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var clients []*Client
	for _, client := range m.clients {
		if client.SessionID == sessionID {
			clients = append(clients, client)
		}
	}

	return clients
}

// BroadcastToSession broadcasts a message to all clients in a session
func (m *Manager) BroadcastToSession(sessionID string, message []byte) {
	clients := m.GetClientsBySession(sessionID)

	for _, client := range clients {
		select {
		case client.Send <- message:
		default:
			logger.Warnf("Client %s send channel full", client.ID)
		}
	}
}
