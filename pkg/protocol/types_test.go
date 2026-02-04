package protocol

import (
	"encoding/json"
	"testing"
	"time"
)

// TestMessageJSONSerialization 测试Message序列化
func TestMessageJSONSerialization(t *testing.T) {
	msg := Message{
		Seq:       1,
		Type:      MessageTypeUser,
		Content:   "Hello, Claude!",
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal message: %v", err)
	}

	var decoded Message
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal message: %v", err)
	}

	if decoded.Seq != msg.Seq {
		t.Errorf("Expected Seq %d, got %d", msg.Seq, decoded.Seq)
	}

	if decoded.Type != msg.Type {
		t.Errorf("Expected Type %s, got %s", msg.Type, decoded.Type)
	}
}

// TestSessionStatusJSONSerialization 测试SessionStatus序列化
func TestSessionStatusJSONSerialization(t *testing.T) {
	status := SessionStatus{
		SessionID:       "test-session-123",
		State:           StateIdle,
		Duration:        60000,
		StartTime:       time.Now().Unix(),
		LastMessageSeq:  10,
		LastMessageType: "user",
		LastMessageTime: time.Now().Unix(),
		TotalMessages:   20,
		ProcessingCount: 5,
		Metadata: SessionMetadata{
			WorkingDir:     "/test/dir",
			Model:          "haiku",
			Agent:          "claude",
			PermissionMode: "normal",
		},
	}

	data, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("Failed to marshal status: %v", err)
	}

	var decoded SessionStatus
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal status: %v", err)
	}

	if decoded.SessionID != status.SessionID {
		t.Errorf("Expected SessionID %s, got %s", status.SessionID, decoded.SessionID)
	}

	if decoded.State != status.State {
		t.Errorf("Expected State %s, got %s", status.State, decoded.State)
	}
}

// TestEventJSONSerialization 测试Event序列化
func TestEventJSONSerialization(t *testing.T) {
	event := Event{
		Type:      EventTypeSessionCreated,
		SessionID: "test-session-123", // 使用SessionID而不是ProcessID
		Timestamp: time.Now(),
		Data:      map[string]string{"test": "data"},
	}

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal event: %v", err)
	}

	var decoded Event
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal event: %v", err)
	}

	if decoded.SessionID != event.SessionID {
		t.Errorf("Expected SessionID %s, got %s", event.SessionID, decoded.SessionID)
	}

	if decoded.Type != event.Type {
		t.Errorf("Expected Type %s, got %s", event.Type, decoded.Type)
	}
}

// TestPermissionRequestJSONSerialization 测试PermissionRequest序列化
func TestPermissionRequestJSONSerialization(t *testing.T) {
	req := PermissionRequest{
		RequestID: "req-123",
		ToolName:  "Bash",
		Reason:    "Need to run command",
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal request: %v", err)
	}

	var decoded PermissionRequest
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal request: %v", err)
	}

	if decoded.RequestID != req.RequestID {
		t.Errorf("Expected RequestID %s, got %s", req.RequestID, decoded.RequestID)
	}
}

// TestToolUseJSONSerialization 测试ToolUse序列化
func TestToolUseJSONSerialization(t *testing.T) {
	toolUse := ToolUse{
		ToolName: "Bash",
		Input: map[string]interface{}{
			"command": "ls -la",
			"timeout": 30000,
		},
	}

	data, err := json.Marshal(toolUse)
	if err != nil {
		t.Fatalf("Failed to marshal tool use: %v", err)
	}

	var decoded ToolUse
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal tool use: %v", err)
	}

	if decoded.ToolName != toolUse.ToolName {
		t.Errorf("Expected ToolName %s, got %s", toolUse.ToolName, decoded.ToolName)
	}
}

// TestMessageTypeConstants 测试消息类型常量
func TestMessageTypeConstants(t *testing.T) {
	tests := []struct {
		name  string
		value MessageType
	}{
		{"User", MessageTypeUser},
		{"Assistant", MessageTypeAssistant},
		{"ToolUse", MessageTypeToolUse},
		{"ToolResult", MessageTypeToolResult},
		{"Permission", MessageTypePermission},
		{"Error", MessageTypeError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.value) == "" {
				t.Errorf("MessageType %s should not be empty", tt.name)
			}
		})
	}
}

// TestSessionStateConstants 测试会话状态常量
func TestSessionStateConstants(t *testing.T) {
	tests := []struct {
		name  string
		value SessionState
	}{
		{"Idle", StateIdle},
		{"Processing", StateProcessing},
		{"Waiting", StateWaiting},
		{"Error", StateError},
		{"Stopped", StateStopped},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.value) == "" {
				t.Errorf("SessionState %s should not be empty", tt.name)
			}
		})
	}
}

// TestEventTypeConstants 测试事件类型常量
func TestEventTypeConstants(t *testing.T) {
	tests := []struct {
		name  string
		value EventType
	}{
		{"SessionCreated", EventTypeSessionCreated},
		{"SessionClosed", EventTypeSessionClosed},
		{"MessageReceived", EventTypeMessageReceived},
		{"PermissionRequested", EventTypePermissionRequested},
		{"Error", EventTypeError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.value) == "" {
				t.Errorf("EventType %s should not be empty", tt.name)
			}
		})
	}
}

// TestEventUsesSessionID 测试Event使用SessionID字段(P0-1验证)
func TestEventUsesSessionID(t *testing.T) {
	event := Event{
		Type:      EventTypeMessageReceived,
		SessionID: "session-123", // 验证使用SessionID而不是ProcessID
		Timestamp: time.Now(),
		Data:      nil,
	}

	// 序列化并反序列化
	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var decoded Event
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// 验证SessionID字段存在且正确
	if decoded.SessionID != "session-123" {
		t.Errorf("Expected SessionID 'session-123', got '%s'", decoded.SessionID)
	}

	// 验证JSON中是sessionId
	var jsonMap map[string]interface{}
	if err := json.Unmarshal(data, &jsonMap); err != nil {
		t.Fatalf("Failed to unmarshal to map: %v", err)
	}

	if _, ok := jsonMap["sessionId"]; !ok {
		t.Error("Event JSON should contain 'sessionId' field")
	}

	// 确保不存在processId字段
	if _, ok := jsonMap["processId"]; ok {
		t.Error("Event JSON should NOT contain 'processId' field (P0-1 fix)")
	}
}
