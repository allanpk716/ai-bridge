package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/WQGroup/logger"
	"github.com/your-org/ai-bridge/internal/config"
	"github.com/your-org/ai-bridge/internal/pool"
	"github.com/your-org/ai-bridge/internal/session"
)

// Checker handles health check requests
type Checker struct {
	config        config.HealthConfig
	pool          *pool.Pool
	sessionMgr    *session.Manager
	startTime     time.Time
}

// NewChecker creates a new health checker
func NewChecker(cfg config.HealthConfig, p *pool.Pool, sm *session.Manager) *Checker {
	return &Checker{
		config:     cfg,
		pool:       p,
		sessionMgr: sm,
		startTime:  time.Now(),
	}
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Uptime    string                 `json:"uptime"`
	Version   string                 `json:"version"`
	System    *SystemInfo            `json:"system,omitempty"`
	Pool      *PoolStatus            `json:"pool,omitempty"`
	Sessions  *SessionStats          `json:"sessions,omitempty"`
}

// SystemInfo represents system information
type SystemInfo struct {
	GoVersion string `json:"goVersion"`
	OS        string `json:"os"`
	Arch      string `json:"arch"`
}

// PoolStatus represents process pool status
type PoolStatus struct {
	TotalInstances int `json:"totalInstances"`
	ActiveCount    int `json:"activeCount"`
	IdleCount      int `json:"idleCount"`
}

// SessionStats represents session statistics
type SessionStats struct {
	TotalSessions int `json:"totalSessions"`
	ActiveSessions int `json:"activeSessions"`
}

// HandleHealthCheck handles health check requests
func (c *Checker) HandleHealthCheck(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Format(time.RFC3339),
		Uptime:    time.Since(c.startTime).String(),
		Version:   "0.1.0",
	}

	// Add system info if enabled
	if c.config.IncludeSystemInfo {
		response.System = &SystemInfo{
			GoVersion: "1.21",
			OS:        "windows",
			Arch:      "amd64",
		}
	}

	// Add pool status if enabled
	if c.config.IncludePoolStatus {
		// TODO: Get actual pool stats
		response.Pool = &PoolStatus{
			TotalInstances: 0,
			ActiveCount:    0,
			IdleCount:      0,
		}
	}

	// Add session stats if enabled
	if c.config.IncludeSessionStats {
		// TODO: Get actual session stats
		response.Sessions = &SessionStats{
			TotalSessions:  0,
			ActiveSessions: 0,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf("Failed to encode health check response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	logger.Debugf("Health check requested from %s", r.RemoteAddr)
}

// CheckSession checks the health of a specific session
func (c *Checker) CheckSession(ctx context.Context, sessionID string) *CheckResult {
	result := &CheckResult{
		Component: sessionID,
		Timestamp: time.Now(),
		Status:    StatusUnknown,
	}

	// Get session
	sess, err := c.sessionMgr.GetSession(sessionID)
	if err != nil {
		result.Status = StatusCritical
		result.Message = "Session not found"
		return result
	}

	// Get session status
	status := sess.GetStatus()

	// Check if session is processing
	if status.State == "processing" {
		// Check duration in milliseconds
		duration := status.Duration

		if duration > 300000 { // 5 minutes
			result.Status = StatusCritical
			result.Message = "Session stuck processing"
		} else if duration > 60000 { // 1 minute
			result.Status = StatusWarning
			result.Message = "Session processing slowly"
		} else {
			result.Status = StatusHealthy
		}
	} else {
		result.Status = StatusHealthy
	}

	return result
}

// CheckAllSessions checks all active sessions
func (c *Checker) CheckAllSessions(ctx context.Context) []*CheckResult {
	var results []*CheckResult

	// Get all sessions
	sessions := c.sessionMgr.ListSessions()

	for _, sessionID := range sessions {
		result := c.CheckSession(ctx, sessionID)
		results = append(results, result)
	}

	return results
}

