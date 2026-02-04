package session

import (
	"os"
	"testing"
)

func TestNewSessionStore(t *testing.T) {
	// Use temporary database
	tmpFile := "test_session.db"
	defer os.Remove(tmpFile)

	store, err := NewSessionStore(tmpFile)
	if err != nil {
		t.Fatalf("Failed to create session store: %v", err)
	}
	defer store.Close()

	// Test creating a session
	sess := &SessionDB{
		SessionID: "test-1",
		Status:    "idle",
	}

	if err := store.CreateSession(sess); err != nil {
		t.Errorf("Failed to create session: %v", err)
	}

	// Test retrieving session
	retrieved, err := store.GetSession("test-1")
	if err != nil {
		t.Errorf("Failed to get session: %v", err)
	}

	if retrieved.SessionID != "test-1" {
		t.Errorf("Expected session ID test-1, got %s", retrieved.SessionID)
	}
}
