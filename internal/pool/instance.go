package pool

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/your-org/ai-bridge/internal/claude"
	"github.com/WQGroup/logger"
)

// Instance represents a Claude CLI process instance
type Instance struct {
	id         string
	process    *claude.Process
	config     claude.Config
	pool       *Pool
	mu         sync.RWMutex
	acquired   bool
	lastUsed   time.Time
	refCount   int
}

// NewInstance creates a new instance
func NewInstance(id string, cfg claude.Config, pool *Pool) *Instance {
	return &Instance{
		id:       id,
		config:   cfg,
		pool:     pool,
		lastUsed: time.Now(),
	}
}

// ID returns the instance ID
func (inst *Instance) ID() string {
	return inst.id
}

// Acquire acquires the instance
func (inst *Instance) Acquire() error {
	inst.mu.Lock()
	defer inst.mu.Unlock()

	if inst.acquired {
		return fmt.Errorf("instance %s already acquired", inst.id)
	}

	inst.acquired = true
	inst.refCount++
	inst.lastUsed = time.Now()

	logger.Debugf("Instance %s acquired (ref count: %d)", inst.id, inst.refCount)
	return nil
}

// Release releases the instance
func (inst *Instance) Release() {
	inst.mu.Lock()
	defer inst.mu.Unlock()

	inst.refCount--
	if inst.refCount <= 0 {
		inst.acquired = false
		inst.refCount = 0
	}

	inst.lastUsed = time.Now()
	logger.Debugf("Instance %s released (ref count: %d)", inst.id, inst.refCount)
}

// IsAvailable returns whether the instance is available
func (inst *Instance) IsAvailable() bool {
	inst.mu.RLock()
	defer inst.mu.RUnlock()

	return !inst.acquired && inst.process != nil && inst.process.IsRunning()
}

// IsIdle returns whether the instance is idle
func (inst *Instance) IsIdle(idleTimeout time.Duration) bool {
	inst.mu.RLock()
	defer inst.mu.RUnlock()

	if inst.acquired {
		return false
	}

	return time.Since(inst.lastUsed) > idleTimeout
}

// GetProcess returns the underlying process
func (inst *Instance) GetProcess() *claude.Process {
	inst.mu.RLock()
	defer inst.mu.RUnlock()

	return inst.process
}

// Start starts the instance
func (inst *Instance) Start(ctx context.Context) error {
	inst.mu.Lock()
	defer inst.mu.Unlock()

	if inst.process != nil && inst.process.IsRunning() {
		return nil
	}

	inst.process = claude.NewProcess(inst.id, inst.config)
	if err := inst.process.Start(ctx); err != nil {
		return fmt.Errorf("failed to start process: %w", err)
	}

	logger.Infof("Instance %s started", inst.id)
	return nil
}

// Stop stops the instance
func (inst *Instance) Stop(ctx context.Context) error {
	inst.mu.Lock()
	defer inst.mu.Unlock()

	if inst.process == nil {
		return nil
	}

	if err := inst.process.Stop(ctx); err != nil {
		return fmt.Errorf("failed to stop process: %w", err)
	}

	logger.Infof("Instance %s stopped", inst.id)
	return nil
}

// LastUsed returns the last used time
func (inst *Instance) LastUsed() time.Time {
	inst.mu.RLock()
	defer inst.mu.RUnlock()
	return inst.lastUsed
}
