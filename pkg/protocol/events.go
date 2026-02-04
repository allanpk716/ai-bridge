// pkg/protocol/events.go
package protocol

import "time"

// EventType 事件类型
type EventType string

const (
	EventTypeSessionCreated      EventType = "session_created"
	EventTypeSessionClosed       EventType = "session_closed"
	EventTypeMessageReceived     EventType = "message_received"
	EventTypePermissionRequested EventType = "permission_requested"
	EventTypeError               EventType = "error"
)

// Event 事件
type Event struct {
	Type      EventType   `json:"type"`
	SessionID string      `json:"sessionId"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}
