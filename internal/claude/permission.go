package claude

import (
	"context"
	"fmt"
	"sync"

	"github.com/your-org/ai-bridge/pkg/protocol"
	"github.com/WQGroup/logger"
)

// PermissionManager manages permission requests
type PermissionManager struct {
	mu       sync.RWMutex
	pending  map[string]*protocol.PermissionRequest
	approved map[string]bool
}

// NewPermissionManager creates a new permission manager
func NewPermissionManager() *PermissionManager {
	return &PermissionManager{
		pending:  make(map[string]*protocol.PermissionRequest),
		approved: make(map[string]bool),
	}
}

// AddRequest adds a permission request
func (pm *PermissionManager) AddRequest(req *protocol.PermissionRequest) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.pending[req.RequestID] = req
	logger.Infof("Permission request added: %s for tool %s", req.RequestID, req.ToolName)
}

// Approve approves a permission request
func (pm *PermissionManager) Approve(ctx context.Context, requestID string, scope string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	req, exists := pm.pending[requestID]
	if !exists {
		return fmt.Errorf("permission request not found: %s", requestID)
	}

	// Mark as approved
	pm.approved[requestID] = true

	// Remove from pending
	delete(pm.pending, requestID)

	logger.Infof("Permission approved: %s for tool %s (scope: %s)", requestID, req.ToolName, scope)

	// Send approval to Claude CLI
	// This would be handled by the process writing to stdin
	return nil
}

// Deny denies a permission request
func (pm *PermissionManager) Deny(ctx context.Context, requestID string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	req, exists := pm.pending[requestID]
	if !exists {
		return fmt.Errorf("permission request not found: %s", requestID)
	}

	// Remove from pending
	delete(pm.pending, requestID)

	logger.Infof("Permission denied: %s for tool %s", requestID, req.ToolName)

	// Send denial to Claude CLI
	// This would be handled by the process writing to stdin
	return nil
}

// GetPending returns all pending permission requests
func (pm *PermissionManager) GetPending() []*protocol.PermissionRequest {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	requests := make([]*protocol.PermissionRequest, 0, len(pm.pending))
	for _, req := range pm.pending {
		requests = append(requests, req)
	}

	return requests
}

// IsApproved checks if a request is approved
func (pm *PermissionManager) IsApproved(requestID string) bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	return pm.approved[requestID]
}
