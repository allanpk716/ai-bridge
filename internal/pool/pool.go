package pool

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/your-org/ai-bridge/internal/claude"
	"github.com/your-org/ai-bridge/internal/config"
	"github.com/WQGroup/logger"
)

// Pool manages Claude CLI process instances
type Pool struct {
	mu              sync.RWMutex
	instances       map[string]*Instance
	available       []*Instance
	config          config.PoolConfig
	claudeConfig    claude.Config
	ctx             context.Context
	cancel          context.CancelFunc
	wg              sync.WaitGroup
	cleanupInterval time.Duration
}

// NewPool creates a new process pool
func NewPool(cfg config.PoolConfig, claudeCfg config.ClaudeConfig) *Pool {
	ctx, cancel := context.WithCancel(context.Background())

	pool := &Pool{
		instances:       make(map[string]*Instance),
		available:       make([]*Instance, 0),
		config:          cfg,
		claudeConfig:    convertClaudeConfig(claudeCfg),
		ctx:             ctx,
		cancel:          cancel,
		cleanupInterval: 30 * time.Second,
	}

	// Start cleanup goroutine
	pool.wg.Add(1)
	go pool.cleanupLoop()

	return pool
}

// convertClaudeConfig converts config.ClaudeConfig to claude.Config
func convertClaudeConfig(cfg config.ClaudeConfig) claude.Config {
	return claude.Config{
		WorkingDir:     cfg.WorkingDir,
		Model:          cfg.DefaultModel,
		PermissionMode: cfg.PermissionMode,
		Timeout:        cfg.Timeout,
	}
}

// Acquire acquires a process instance from the pool
func (p *Pool) Acquire(ctx context.Context) (*Instance, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	// Check if we have available instances
	for len(p.available) > 0 {
		// Get the last available instance (LIFO)
		inst := p.available[len(p.available)-1]
		p.available = p.available[:len(p.available)-1]

		// Check if instance is still valid
		if inst.IsAvailable() {
			if err := inst.Acquire(); err != nil {
				continue
			}

			logger.Infof("Acquired existing instance %s from pool", inst.ID())
			return inst, nil
		}

		// Remove stale instance
		delete(p.instances, inst.ID())
	}

	// Check if we can create a new instance
	if len(p.instances) >= p.config.MaxInstances {
		return nil, fmt.Errorf("process pool full (max: %d)", p.config.MaxInstances)
	}

	// Create new instance
	inst := p.createNewInstance()
	p.instances[inst.ID()] = inst

	// Start the instance
	startCtx, cancel := context.WithTimeout(ctx, p.config.StartupTimeout)
	defer cancel()

	if err := inst.Start(startCtx); err != nil {
		delete(p.instances, inst.ID())
		return nil, fmt.Errorf("failed to start instance: %w", err)
	}

	if err := inst.Acquire(); err != nil {
		delete(p.instances, inst.ID())
		return nil, fmt.Errorf("failed to acquire instance: %w", err)
	}

	logger.Infof("Created and acquired new instance %s (pool size: %d/%d)", inst.ID(), len(p.instances), p.config.MaxInstances)
	return inst, nil
}

// Release releases an instance back to the pool
func (p *Pool) Release(inst *Instance) {
	p.mu.Lock()
	defer p.mu.Unlock()

	inst.Release()

	// Add back to available if still running
	if inst.IsAvailable() {
		p.available = append(p.available, inst)
		logger.Debugf("Released instance %s back to pool", inst.ID())
	} else {
		// Remove dead instance
		delete(p.instances, inst.ID())
		logger.Infof("Removed dead instance %s from pool", inst.ID())
	}
}

// Shutdown gracefully shuts down the process pool
func (p *Pool) Shutdown(ctx context.Context) error {
	logger.Info("Shutting down process pool...")

	// Stop cleanup goroutine
	p.cancel()
	p.wg.Wait()

	p.mu.Lock()
	defer p.mu.Unlock()

	// Shutdown all instances
	var wg sync.WaitGroup
	errChan := make(chan error, len(p.instances))

	for _, inst := range p.instances {
		wg.Add(1)
		go func(i *Instance) {
			defer wg.Done()

			shutdownCtx, cancel := context.WithTimeout(ctx, p.config.ShutdownTimeout)
			defer cancel()

			if err := i.Stop(shutdownCtx); err != nil {
				errChan <- err
			}
		}(inst)
	}

	wg.Wait()
	close(errChan)

	// Collect errors
	var errors []error
	for err := range errChan {
		errors = append(errors, err)
	}

	// Clear pool
	p.instances = make(map[string]*Instance)
	p.available = make([]*Instance, 0)

	if len(errors) > 0 {
		return fmt.Errorf("errors during shutdown: %v", errors)
	}

	logger.Info("Process pool shutdown complete")
	return nil
}

// Stats returns pool statistics
func (p *Pool) Stats() PoolStats {
	p.mu.RLock()
	defer p.mu.RUnlock()

	active := 0
	idle := 0

	for _, inst := range p.instances {
		if inst.IsAvailable() {
			idle++
		} else {
			active++
		}
	}

	return PoolStats{
		TotalInstances: len(p.instances),
		ActiveInstances: active,
		IdleInstances:   idle,
		MaxInstances:    p.config.MaxInstances,
		Available:       len(p.available),
	}
}

// PoolStats represents pool statistics
type PoolStats struct {
	TotalInstances  int `json:"totalInstances"`
	ActiveInstances int `json:"activeInstances"`
	IdleInstances   int `json:"idleInstances"`
	MaxInstances    int `json:"maxInstances"`
	Available       int `json:"available"`
}

// cleanupLoop periodically cleans up idle instances
func (p *Pool) cleanupLoop() {
	defer p.wg.Done()

	ticker := time.NewTicker(p.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			p.cleanupIdleInstances()
		}
	}
}

// cleanupIdleInstances removes idle instances that have exceeded the timeout
func (p *Pool) cleanupIdleInstances() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.config.IdleTimeout <= 0 {
		return
	}

	var toRemove []string
	now := time.Now()

	for id, inst := range p.instances {
		if !inst.IsAvailable() {
			continue
		}

		idleTime := now.Sub(inst.LastUsed())
		if idleTime > p.config.IdleTimeout {
			toRemove = append(toRemove, id)
		}
	}

	// Remove idle instances
	for _, id := range toRemove {
		inst := p.instances[id]
		logger.Infof("Removing idle instance %s (idle for %v)", id, now.Sub(inst.LastUsed()))

		// Stop the instance
		ctx, cancel := context.WithTimeout(p.ctx, 10*time.Second)
		if err := inst.Stop(ctx); err != nil {
			logger.Errorf("Failed to stop idle instance %s: %v", id, err)
		}
		cancel()

		// Remove from pool
		delete(p.instances, id)

		// Remove from available
		for i, avail := range p.available {
			if avail.ID() == id {
				p.available = append(p.available[:i], p.available[i+1:]...)
				break
			}
		}
	}

	if len(toRemove) > 0 {
		logger.Infof("Cleaned up %d idle instances (remaining: %d/%d)", len(toRemove), len(p.instances), p.config.MaxInstances)
	}
}

// createNewInstance creates a new instance with a unique ID
func (p *Pool) createNewInstance() *Instance {
	id := fmt.Sprintf("inst-%d", time.Now().UnixNano())
	inst := NewInstance(id, p.claudeConfig, p)
	return inst
}
