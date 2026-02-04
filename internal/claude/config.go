package claude

import "time"

// Config Claude Code configuration
type Config struct {
	WorkingDir      string            `json:"workingDirectory"`
	Model           string            `json:"model,omitempty"`
	PermissionMode  string            `json:"permissionMode"`
	AllowedTools    []string          `json:"allowedTools,omitempty"`
	DisallowedTools []string          `json:"disallowedTools,omitempty"`
	MaxTurns        int               `json:"maxTurns,omitempty"`
	EnvVars         map[string]string `json:"envVars,omitempty"`
	Timeout         time.Duration     `json:"timeout"`
}
