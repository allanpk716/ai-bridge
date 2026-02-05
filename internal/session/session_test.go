package session

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/your-org/ai-bridge/pkg/protocol"
)

func TestNewSession(t *testing.T) {
	store, err := NewSessionStore(":memory:")
	require.NoError(t, err)

	cfg := SessionConfig{
		MaxRecentMessages: 100,
		MessageBufferSize: 50,
	}

	sess := NewSession("test-sess", nil, store, cfg)

	require.NotNil(t, sess)
	assert.Equal(t, "test-sess", sess.ID())
}

func TestSession_GetStatus(t *testing.T) {
	store, err := NewSessionStore(":memory:")
	require.NoError(t, err)

	cfg := SessionConfig{
		MaxRecentMessages: 100,
		MessageBufferSize: 50,
	}

	sess := NewSession("test-sess", nil, store, cfg)

	status := sess.GetStatus()

	assert.Equal(t, "test-sess", status.SessionID)
	assert.Equal(t, protocol.StateIdle, status.State)
}

func TestSession_GetMessages(t *testing.T) {
	store, err := NewSessionStore(":memory:")
	require.NoError(t, err)

	cfg := SessionConfig{
		MaxRecentMessages: 100,
		MessageBufferSize: 50,
	}

	sess := NewSession("test-sess", nil, store, cfg)

	// Test getting messages from empty session
	opts := GetMessagesOptions{
		SinceSeq: 0,
		Limit:    10,
	}

	messages, err := sess.GetMessages(opts)
	require.NoError(t, err)
	assert.Equal(t, 0, len(messages))
}

func TestSession_Close(t *testing.T) {
	store, err := NewSessionStore(":memory:")
	require.NoError(t, err)

	cfg := SessionConfig{
		MaxRecentMessages: 100,
		MessageBufferSize: 50,
	}

	sess := NewSession("test-sess", nil, store, cfg)

	err = sess.Close()
	assert.NoError(t, err)
}

