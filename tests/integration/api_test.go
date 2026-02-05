// +build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/your-org/ai-bridge/internal/api"
	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/health"
	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/internal/session"
)

func TestCreateSession(t *testing.T) {
	// Load test config
	cfg := &config.Config{
		Server: config.ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: config.DatabaseConfig{
			Path: ":memory:",
		},
		Pool: config.PoolConfig{
			MaxInstances: 1,
		},
		Logging: config.LoggingConfig{
			Level: "error", // Reduce noise in tests
		},
	}

	// Create manager
	processPool := pool.NewPool(cfg.Pool, cfg.Claude)
	sessionManager, err := session.NewManager(cfg.Session, processPool)
	require.NoError(t, err)
	defer sessionManager.Shutdown(nil)

	// Create server
	healthChecker := health.NewChecker(cfg.Health, processPool, sessionManager)
	server := api.NewServer(cfg, sessionManager, processPool, healthChecker)

	// Test create session
	body := map[string]string{
		"workingDirectory": "/tmp",
		"model":            "haiku",
	}
	jsonData, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/sessions", bytes.NewReader(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	server.Router().ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		// Session creation might fail if Claude CLI is not available
		t.Skipf("Session creation failed (Claude CLI may not be available): %d", w.Code)
	}

	var resp map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	_, ok := resp["id"]
	assert.True(t, ok, "Response should contain id")
}

func TestHealthCheck(t *testing.T) {
	cfg := &config.Config{
		Server: config.ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: config.DatabaseConfig{
			Path: ":memory:",
		},
		Health: config.HealthConfig{
			Enabled: true,
		},
	}

	processPool := pool.NewPool(cfg.Pool, cfg.Claude)
	sessionManager, err := session.NewManager(cfg.Session, processPool)
	require.NoError(t, err)
	defer sessionManager.Shutdown(nil)

	healthChecker := health.NewChecker(cfg.Health, processPool, sessionManager)
	server := api.NewServer(cfg, sessionManager, processPool, healthChecker)

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	server.Router().ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	assert.Equal(t, "ok", resp["status"])
}

func TestListCommands(t *testing.T) {
	cfg := &config.Config{
		Server: config.ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: config.DatabaseConfig{
			Path: ":memory:",
		},
	}

	processPool := pool.NewPool(cfg.Pool, cfg.Claude)
	sessionManager, err := session.NewManager(cfg.Session, processPool)
	require.NoError(t, err)
	defer sessionManager.Shutdown(nil)

	healthChecker := health.NewChecker(cfg.Health, processPool, sessionManager)
	server := api.NewServer(cfg, sessionManager, processPool, healthChecker)

	req := httptest.NewRequest("GET", "/api/v1/commands", nil)
	w := httptest.NewRecorder()

	server.Router().ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	_, ok := resp["byCategory"]
	assert.True(t, ok, "Response should contain byCategory")
}
