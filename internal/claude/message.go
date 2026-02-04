package claude

import (
	"encoding/json"
	"fmt"

	"github.com/your-org/ai-bridge/pkg/protocol"
)

// MessageParser parses messages from Claude CLI
type MessageParser struct{}

// NewMessageParser creates a new message parser
func NewMessageParser() *MessageParser {
	return &MessageParser{}
}

// Parse parses a JSON message string
func (mp *MessageParser) Parse(data []byte) (*protocol.Message, error) {
	var rawData map[string]interface{}
	if err := json.Unmarshal(data, &rawData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	msgType, ok := rawData["type"].(string)
	if !ok {
		return nil, fmt.Errorf("missing message type")
	}

	msg := &protocol.Message{}

	switch msgType {
	case "assistant":
		msg.Type = protocol.MessageTypeAssistant
		msg.Content = rawData["content"]

	case "tool_use":
		msg.Type = protocol.MessageTypeToolUse
		msg.Content = protocol.ToolUse{
			ToolName: rawData["tool_name"].(string),
			Input:    rawData["input"].(map[string]interface{}),
		}

	case "tool_result":
		msg.Type = protocol.MessageTypeToolResult
		msg.Content = protocol.ToolResult{
			ToolName: rawData["tool_name"].(string),
			Output:   rawData["output"].(string),
		}

	case "permission_request":
		msg.Type = protocol.MessageTypePermission
		msg.Content = protocol.PermissionRequest{
			RequestID: rawData["request_id"].(string),
			ToolName:  rawData["tool_name"].(string),
			Reason:    rawData["reason"].(string),
		}

	case "error":
		msg.Type = protocol.MessageTypeError
		msg.Content = rawData["error"]

	default:
		return nil, fmt.Errorf("unknown message type: %s", msgType)
	}

	return msg, nil
}

// parseTimestamp parses timestamp from raw data
func (mp *MessageParser) parseTimestamp(rawData map[string]interface{}) interface{} {
	if ts, ok := rawData["timestamp"].(string); ok {
		return ts
	}
	return nil
}
