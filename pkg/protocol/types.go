// pkg/protocol/types.go
package protocol

import "time"

// MessageType 消息类型
type MessageType string

const (
	MessageTypeUser       MessageType = "user"
	MessageTypeAssistant  MessageType = "assistant"
	MessageTypeToolUse    MessageType = "tool_use"
	MessageTypeToolResult MessageType = "tool_result"
	MessageTypePermission MessageType = "permission_request"
	MessageTypeError      MessageType = "error"
)

// SessionState 会话状态
type SessionState string

const (
	StateIdle       SessionState = "idle"
	StateProcessing SessionState = "processing"
	StateWaiting    SessionState = "waiting"
	StateError      SessionState = "error"
	StateStopped    SessionState = "stopped"
)

// Message 消息结构
type Message struct {
	Seq                int64       `json:"seq"`
	Type               MessageType `json:"type"`
	Content            interface{} `json:"content"`
	Timestamp           time.Time   `json:"timestamp"`
	ProcessingDuration  int64       `json:"processingDuration,omitempty"`
	ProcessingStarted   int64       `json:"processingStarted,omitempty"`
	ProcessingEnded     int64       `json:"processingEnded,omitempty"`
	Status              string      `json:"status,omitempty"`
}

// SessionStatus 会话状态信息
type SessionStatus struct {
	SessionID       string       `json:"sessionId"`
	State           SessionState `json:"state"`
	Duration        int64        `json:"duration"`
	StartTime       int64        `json:"startTime"`
	LastMessageSeq  int64        `json:"lastMessageSeq"`
	LastMessageType string       `json:"lastMessageType"`
	LastMessageTime int64        `json:"lastMessageTime"`
	TotalMessages   int64        `json:"totalMessages"`
	ProcessingCount int64        `json:"processingCount"`
	Error           string       `json:"error,omitempty"`
	ErrorCode       string       `json:"errorCode,omitempty"`
	Metadata        SessionMetadata `json:"metadata,omitempty"`
}

// SessionMetadata 会话元数据
type SessionMetadata struct {
	WorkingDir    string `json:"workingDirectory"`
	Model         string `json:"model"`
	Agent         string `json:"agent"`
	PermissionMode string `json:"permissionMode"`
}
