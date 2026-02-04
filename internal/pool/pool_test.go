package pool

import (
	"testing"
	"time"

	"github.com/your-org/ai-bridge/internal/config"
)

func TestNewPool(t *testing.T) {
	cfg := config.PoolConfig{
		MaxInstances:   5,
		IdleTimeout:    300 * time.Second,
		StartupTimeout: 10 * time.Second,
	}

	claudeCfg := config.ClaudeConfig{
		DefaultModel:   "haiku",
		PermissionMode: "normal",
		Timeout:        300 * time.Second,
	}

	pool := NewPool(cfg, claudeCfg)
	if pool == nil {
		t.Fatal("Expected non-nil pool")
	}

	defer pool.Shutdown(nil)

	stats := pool.Stats()
	if stats.TotalInstances != 0 {
		t.Errorf("Expected 0 instances, got %d", stats.TotalInstances)
	}
}
