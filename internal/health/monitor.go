package health

import (
	"context"
	"time"

	"github.com/your-org/ai-bridge/internal/config"
	"github.com/WQGroup/logger"
)

// Monitor monitors health and sends alerts
type Monitor struct {
	checker   *Checker
	config    config.HealthConfig
	alertChan chan *CheckResult
	ctx       context.Context
	cancel    context.CancelFunc
}

// NewMonitor creates a new health monitor
func NewMonitor(checker *Checker, cfg config.HealthConfig) *Monitor {
	ctx, cancel := context.WithCancel(context.Background())

	return &Monitor{
		checker:   checker,
		config:    cfg,
		alertChan: make(chan *CheckResult, 100),
		ctx:       ctx,
		cancel:    cancel,
	}
}

// Start starts the health monitoring loop
func (m *Monitor) Start() {
	if !m.config.Enabled {
		logger.Info("Health monitoring disabled")
		return
	}

	ticker := time.NewTicker(m.config.CheckInterval)
	defer ticker.Stop()

	logger.Infof("Health monitoring started (interval: %s)", m.config.CheckInterval)

	for {
		select {
		case <-m.ctx.Done():
			logger.Info("Health monitoring stopped")
			return
		case <-ticker.C:
			m.runChecks()
		}
	}
}

// Stop stops the monitor
func (m *Monitor) Stop() {
	m.cancel()
}

// runChecks executes health checks
func (m *Monitor) runChecks() {
	// Check all active sessions
	results := m.checker.CheckAllSessions(m.ctx)

	for _, result := range results {
		if result.Status == StatusCritical || result.Status == StatusWarning {
			m.alertChan <- result

			if m.config.SendWarning {
				logger.Warnf("Health alert [%s]: %s - %s",
					result.Component, result.Status, result.Message)
			}

			// Optionally restart crashed sessions
			if result.Status == StatusCritical && m.config.RestartOnCrash {
				m.handleCrash(result)
			}
		}
	}
}

// handleCrash handles a crashed session
func (m *Monitor) handleCrash(result *CheckResult) {
	logger.Errorf("Handling crash for %s", result.Component)
	// TODO: Implement restart logic
}

// Alerts returns the alert channel
func (m *Monitor) Alerts() <-chan *CheckResult {
	return m.alertChan
}
