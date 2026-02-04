// pkg/protocol/messages.go
package protocol

// PermissionRequest 权限请求
type PermissionRequest struct {
	RequestID string `json:"requestId"`
	ToolName  string `json:"toolName"`
	Reason    string `json:"reason"`
}

// PermissionResponse 权限响应
type PermissionResponse struct {
	RequestID string `json:"requestId"`
	Approved  bool   `json:"approved"`
	Scope     string `json:"scope"` // "once" or "session"
}

// ToolUse 工具使用
type ToolUse struct {
	ToolName string                 `json:"toolName"`
	Input    map[string]interface{} `json:"input"`
}

// ToolResult 工具结果
type ToolResult struct {
	ToolName string `json:"toolName"`
	Output   string `json:"output"`
	Error    string `json:"error,omitempty"`
}
