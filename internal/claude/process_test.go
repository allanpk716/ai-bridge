package claude

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewProcess(t *testing.T) {
	config := Config{
		WorkingDir:     "/tmp",
		Model:          "haiku",
		PermissionMode: "normal",
	}

	proc := NewProcess("test-id", config)

	require.NotNil(t, proc)
	assert.Equal(t, "test-id", proc.ID())
}

func TestProcess_StartStop(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	config := Config{
		WorkingDir:     "/tmp",
		Model:          "haiku",
		PermissionMode: "normal",
	}

	proc := NewProcess("test-start-stop", config)
	ctx := context.Background()

	// Start
	err := proc.Start(ctx)
	if err != nil {
		t.Skip("Claude CLI not available:", err)
	}

	assert.True(t, proc.IsRunning())

	// Wait a bit
	time.Sleep(100 * time.Millisecond)

	// Stop
	err = proc.Stop(ctx)
	require.NoError(t, err)

	assert.False(t, proc.IsRunning())
}

func TestProcess_SendMessage(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	config := Config{
		WorkingDir:     "/tmp",
		Model:          "haiku",
		PermissionMode: "normal",
	}

	proc := NewProcess("test-send-message", config)
	ctx := context.Background()

	// Start process
	err := proc.Start(ctx)
	if err != nil {
		t.Skip("Claude CLI not available:", err)
	}
	defer proc.Stop(ctx)

	// Send message
	err = proc.SendMessage(ctx, "Hello")
	assert.NoError(t, err)
}

func TestProcess_SetMessageCallbacks(t *testing.T) {
	config := Config{
		WorkingDir: "/tmp",
	}

	proc := NewProcess("test-callbacks", config)

	callbacks := &MessageCallbacks{
		OnStarted: func(seq int64) {
			t.Logf("Message %d started", seq)
		},
		OnEnded: func(seq int64, duration time.Duration) {
			t.Logf("Message %d ended in %v", seq, duration)
		},
	}

	proc.SetMessageCallbacks(callbacks)

	// Verify callbacks are set (no direct way to check, but no panic is good)
}
