package claude

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/your-org/ai-bridge/pkg/protocol"
	"github.com/WQGroup/logger"
)

// Process Claude Code CLI process wrapper
type Process struct {
	id        string
	config    Config
	cmd       *exec.Cmd
	stdin     io.WriteCloser
	stdout    io.ReadCloser
	stderr    io.ReadCloser

	messageChan chan protocol.Message
	errorChan   chan error
	eventChan   chan protocol.Event

	mu               sync.RWMutex
	running          bool
	started          time.Time
	messageCallbacks *MessageCallbacks

	// Message sequence
	lastSeq int64
}

// MessageCallbacks callbacks for message lifecycle events
type MessageCallbacks struct {
	OnStarted func(seq int64)
	OnEnded   func(seq int64, duration time.Duration)
}

// NewProcess creates a new Claude Code process
func NewProcess(id string, config Config) *Process {
	return &Process{
		id:          id,
		config:      config,
		messageChan: make(chan protocol.Message, 100),
		errorChan:   make(chan error, 10),
		eventChan:   make(chan protocol.Event, 10),
	}
}

// SetMessageCallbacks sets the message callbacks
func (p *Process) SetMessageCallbacks(callbacks *MessageCallbacks) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.messageCallbacks = callbacks
}

// Start starts the Claude Code process
func (p *Process) Start(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.running {
		return fmt.Errorf("process already running")
	}

	logger.Infof("Starting Claude Code process: %s", p.id)

	// Build command
	args := []string{}
	if p.config.Model != "" {
		args = append(args, "--model", p.config.Model)
	}
	if p.config.PermissionMode != "" {
		args = append(args, "--permission-mode", p.config.PermissionMode)
	}
	if p.config.WorkingDir != "" {
		args = append(args, "--working-dir", p.config.WorkingDir)
	}

	p.cmd = exec.CommandContext(ctx, "claude", args...)
	if p.config.WorkingDir != "" {
		p.cmd.Dir = p.config.WorkingDir
	}

	// Set up pipes
	stdin, err := p.cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("failed to create stdin: %w", err)
	}
	p.stdin = stdin

	stdout, err := p.cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to create stdout: %w", err)
	}
	p.stdout = stdout

	stderr, err := p.cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to create stderr: %w", err)
	}
	p.stderr = stderr

	// Set environment variables
	if len(p.config.EnvVars) > 0 {
		env := p.cmd.Environ()
		for k, v := range p.config.EnvVars {
			env = append(env, fmt.Sprintf("%s=%s", k, v))
		}
		p.cmd.Env = env
	}

	// Start process
	if err := p.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start process: %w", err)
	}

	p.running = true
	p.started = time.Now()

	// Start output readers
	go p.readOutputLoop()
	go p.readErrorLoop()

	// Send started event
	p.eventChan <- protocol.Event{
		Type:      protocol.EventTypeSessionCreated,
		SessionID: p.id,
		Timestamp: time.Now(),
	}

	logger.Infof("Claude Code process started: %s", p.id)
	return nil
}

// Stop stops the process
func (p *Process) Stop(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if !p.running {
		return nil
	}

	logger.Infof("Stopping Claude Code process: %s", p.id)

	// Close stdin to signal EOF
	if p.stdin != nil {
		p.stdin.Close()
	}

	// Wait for process to exit or timeout
	done := make(chan error, 1)
	go func() {
		done <- p.cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		// Context cancelled, force kill
		logger.Warnf("Process %s timeout, killing", p.id)
		if p.cmd.Process != nil {
			p.cmd.Process.Kill()
		}
		<-done // Wait for Wait() to return
	case err := <-done:
		if err != nil {
			logger.Errorf("Process %s exited with error: %v", p.id, err)
		}
	}

	p.running = false

	// Send closed event
	p.eventChan <- protocol.Event{
		Type:      protocol.EventTypeSessionClosed,
		SessionID: p.id,
		Timestamp: time.Now(),
	}

	logger.Infof("Claude Code process stopped: %s", p.id)
	return nil
}

// SendMessage sends a message to the process
func (p *Process) SendMessage(ctx context.Context, content string) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if !p.running {
		return fmt.Errorf("process not running")
	}

	// Increment sequence number
	seq := atomic.AddInt64(&p.lastSeq, 1)

	// Create user message
	msg := protocol.Message{
		Seq:      seq,
		Type:     protocol.MessageTypeUser,
		Content:  content,
		Timestamp: time.Now(),
	}

	// Send message to channel
	select {
	case p.messageChan <- msg:
	case <-ctx.Done():
		return ctx.Err()
	}

	// Send to stdin
	if p.stdin != nil {
		if _, err := fmt.Fprintln(p.stdin, content); err != nil {
			return fmt.Errorf("failed to write to stdin: %w", err)
		}
	}

	return nil
}

// SendApproval sends a permission approval or denial to the process
func (p *Process) SendApproval(ctx context.Context, requestID string, approved bool, scope string) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if !p.running {
		return fmt.Errorf("process not running")
	}

	var response string
	if approved {
		response = fmt.Sprintf("approve %s %s", requestID, scope)
	} else {
		response = fmt.Sprintf("deny %s", requestID)
	}

	if p.stdin != nil {
		if _, err := fmt.Fprintln(p.stdin, response); err != nil {
			return fmt.Errorf("failed to send approval: %w", err)
		}
	}

	logger.Infof("Permission decision sent: %s -> approved=%v, scope=%s", requestID, approved, scope)
	return nil
}

// MessageChannel returns the message channel
func (p *Process) MessageChannel() <-chan protocol.Message {
	return p.messageChan
}

// ErrorChannel returns the error channel
func (p *Process) ErrorChannel() <-chan error {
	return p.errorChan
}

// EventChannel returns the event channel
func (p *Process) EventChannel() <-chan protocol.Event {
	return p.eventChan
}

// IsRunning returns whether the process is running
func (p *Process) IsRunning() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.running
}

// ID returns the process ID
func (p *Process) ID() string {
	return p.id
}

// readOutputLoop reads stdout and parses messages
func (p *Process) readOutputLoop() {
	defer close(p.messageChan)

	scanner := bufio.NewScanner(p.stdout)
	var currentMessage *strings.Builder
	var inJSONBlock bool

	for scanner.Scan() {
		line := scanner.Text()

		// Detect JSON output blocks (Claude CLI uses <!-- <json>...</json> -->)
		if strings.HasPrefix(line, "<!-- <json>") {
			inJSONBlock = true
			currentMessage = &strings.Builder{}
			continue
		}

		if strings.HasSuffix(line, "</json> -->") {
			inJSONBlock = false
			jsonContent := strings.TrimSpace(
				strings.TrimSuffix(
					strings.TrimPrefix(currentMessage.String(), "<!-- <json>"),
					"</json> -->",
				),
			)

			// Parse JSON message
			if err := p.parseMessage(jsonContent); err != nil {
				logger.Errorf("Failed to parse message: %v", err)
			}
			continue
		}

		if inJSONBlock && currentMessage != nil {
			currentMessage.WriteString(line)
			currentMessage.WriteString("\n")
		}
	}

	if err := scanner.Err(); err != nil {
		p.errorChan <- fmt.Errorf("stdout read error: %w", err)
	}
}

// readErrorLoop reads stderr
func (p *Process) readErrorLoop() {
	scanner := bufio.NewScanner(p.stderr)
	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			logger.Errorf("Claude CLI [%s] stderr: %s", p.id, line)
		}
	}

	if err := scanner.Err(); err != nil {
		p.errorChan <- fmt.Errorf("stderr read error: %w", err)
	}
}

// parseMessage parses a JSON message from Claude CLI
func (p *Process) parseMessage(jsonContent string) error {
	var rawData map[string]interface{}
	if err := json.Unmarshal([]byte(jsonContent), &rawData); err != nil {
		return err
	}

	// Determine message type
	msgType, ok := rawData["type"].(string)
	if !ok {
		return fmt.Errorf("missing message type")
	}

	// Increment sequence
	seq := atomic.AddInt64(&p.lastSeq, 1)

	// Create message
	msg := protocol.Message{
		Seq:       seq,
		Timestamp: time.Now(),
	}

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

		// Send permission event
		p.eventChan <- protocol.Event{
			Type:      protocol.EventTypePermissionRequested,
			SessionID: p.id,
			Timestamp: time.Now(),
			Data:      msg.Content,
		}

	case "error":
		msg.Type = protocol.MessageTypeError
		msg.Content = rawData["error"]

		// Send error event
		p.eventChan <- protocol.Event{
			Type:      protocol.EventTypeError,
			SessionID: p.id,
			Timestamp: time.Now(),
			Data:      msg.Content,
		}

	default:
		return fmt.Errorf("unknown message type: %s", msgType)
	}

	// Call message started callback
	if p.messageCallbacks != nil && p.messageCallbacks.OnStarted != nil {
		p.messageCallbacks.OnStarted(seq)
	}

	// Send message to channel
	select {
	case p.messageChan <- msg:
	default:
		logger.Warnf("Message channel full for process %s, dropping message", p.id)
	}

	// Call message ended callback
	if p.messageCallbacks != nil && p.messageCallbacks.OnEnded != nil {
		p.messageCallbacks.OnEnded(seq, 0)
	}

	return nil
}
