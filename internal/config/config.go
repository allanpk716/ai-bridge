package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// Config represents the application configuration
type Config struct {
	Server      ServerConfig      `yaml:"server"`
	CORS        CORSConfig        `yaml:"cors"`
	Database    DatabaseConfig    `yaml:"database"`
	Auth        AuthConfig        `yaml:"auth"`
	Pool        PoolConfig        `yaml:"pool"`
	Claude      ClaudeConfig      `yaml:"claude"`
	Session     SessionConfig     `yaml:"session"`
	WebSocket   WebSocketConfig   `yaml:"websocket"`
	Performance PerformanceConfig `yaml:"performance"`
	Logging     LoggingConfig     `yaml:"logging"`
	Health      HealthConfig      `yaml:"health"`
	Metrics     MetricsConfig     `yaml:"metrics"`
	Development DevelopmentConfig `yaml:"development"`
	Security    SecurityConfig    `yaml:"security"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Host         string        `yaml:"host"`
	Port         int           `yaml:"port"`
	PublicURL    string        `yaml:"publicUrl"`
	ReadTimeout  time.Duration `yaml:"readTimeout"`
	WriteTimeout time.Duration `yaml:"writeTimeout"`
	IdleTimeout  time.Duration `yaml:"idleTimeout"`
}

// CORSConfig represents CORS configuration
type CORSConfig struct {
	Origins         []string `yaml:"origins"`
	Methods         []string `yaml:"methods"`
	Headers         []string `yaml:"headers"`
	AllowCredentials bool    `yaml:"allowCredentials"`
	MaxAge          int      `yaml:"maxAge"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Path            string `yaml:"path"`
	EnableWAL       bool   `yaml:"enableWAL"`
	Timeout         int    `yaml:"timeout"`
	MaxOpenConns    int    `yaml:"maxOpenConns"`
	MaxIdleConns    int    `yaml:"maxIdleConns"`
	ConnMaxLifetime int    `yaml:"connMaxLifetime"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	JWTSecret     string        `yaml:"jwtSecret"`
	JWTExpiration time.Duration `yaml:"jwtExpiration"`
	CliApiToken   string        `yaml:"cliApiToken"`
	Enabled       bool          `yaml:"enabled"`
}

// PoolConfig represents process pool configuration
type PoolConfig struct {
	MaxInstances        int           `yaml:"maxInstances"`
	IdleTimeout         time.Duration `yaml:"idleTimeout"`
	StartupTimeout      time.Duration `yaml:"startupTimeout"`
	ShutdownTimeout     time.Duration `yaml:"shutdownTimeout"`
	HealthCheckInterval time.Duration `yaml:"healthCheckInterval"`
}

// ClaudeConfig represents Claude CLI configuration
type ClaudeConfig struct {
	DefaultModel   string        `yaml:"defaultModel"`
	Timeout        time.Duration `yaml:"timeout"`
	PermissionMode string        `yaml:"permissionMode"`
	WorkingDir     string        `yaml:"workingDir"`
	Env            []string      `yaml:"env"`
}

// SessionConfig represents session configuration
type SessionConfig struct {
	MaxSessions       int           `yaml:"maxSessions"`
	SessionTimeout    time.Duration `yaml:"sessionTimeout"`
	MaxRecentMessages int           `yaml:"maxRecentMessages"`
	EnablePersistence bool          `yaml:"enablePersistence"`
	CleanupInterval   time.Duration `yaml:"cleanupInterval"`
}

// WebSocketConfig represents WebSocket configuration
type WebSocketConfig struct {
	Enabled        bool          `yaml:"enabled"`
	Path           string        `yaml:"path"`
	PingInterval   time.Duration `yaml:"pingInterval"`
	PingTimeout    time.Duration `yaml:"pingTimeout"`
	MaxMessageSize int           `yaml:"maxMessageSize"`
	BufferSize     int           `yaml:"bufferSize"`
}

// PerformanceConfig represents performance tuning configuration
type PerformanceConfig struct {
	MaxRecentMessages      int  `yaml:"maxRecentMessages"`
	MessageBufferSize      int  `yaml:"messageBufferSize"`
	SubscriberBufferSize   int  `yaml:"subscriberBufferSize"`
	MaxConcurrentHandlers  int  `yaml:"maxConcurrentHandlers"`
	EnableMessageBatching  bool `yaml:"enableMessageBatching"`
	MessageBatchSize       int  `yaml:"messageBatchSize"`
	MessageBatchTimeout    int  `yaml:"messageBatchTimeout"`
}

// LoggingConfig represents logging configuration
type LoggingConfig struct {
	Level      string `yaml:"level"`
	Format     string `yaml:"format"`
	Output     string `yaml:"output"`
	Directory  string `yaml:"directory"`
	Filename   string `yaml:"filename"`
	MaxSize    int    `yaml:"maxSize"`
	MaxBackups int    `yaml:"maxBackups"`
	MaxAge     int    `yaml:"maxAge"`
	Compress   bool   `yaml:"compress"`
}

// HealthConfig represents health check configuration
type HealthConfig struct {
	Enabled             bool `yaml:"enabled"`
	Path                string `yaml:"path"`
	IncludeSystemInfo   bool `yaml:"includeSystemInfo"`
	IncludePoolStatus   bool `yaml:"includePoolStatus"`
	IncludeSessionStats bool `yaml:"includeSessionStats"`
}

// MetricsConfig represents metrics configuration
type MetricsConfig struct {
	Enabled  bool          `yaml:"enabled"`
	Path     string        `yaml:"path"`
	Interval time.Duration `yaml:"interval"`
}

// DevelopmentConfig represents development mode configuration
type DevelopmentConfig struct {
	Enabled        bool   `yaml:"enabled"`
	DebugEndpoints bool   `yaml:"debugEndpoints"`
	Profiling      bool   `yaml:"profiling"`
	ProfilingPath  string `yaml:"profilingPath"`
}

// SecurityConfig represents security configuration
type SecurityConfig struct {
	RateLimitEnabled bool     `yaml:"rateLimitEnabled"`
	RateLimitRPM     int      `yaml:"rateLimitRPM"`
	RequestLogging   bool     `yaml:"requestLogging"`
	TrustedProxies   []string `yaml:"trustedProxies"`
}

// Load loads configuration from file
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Expand environment variables in config
	expandEnvVars(&cfg)

	return &cfg, nil
}

// expandEnvVars expands environment variables in configuration
func expandEnvVars(cfg *Config) {
	// Expand environment variables for string fields
	cfg.Auth.JWTSecret = os.ExpandEnv(cfg.Auth.JWTSecret)
	cfg.Auth.CliApiToken = os.ExpandEnv(cfg.Auth.CliApiToken)
	cfg.Server.PublicURL = os.ExpandEnv(cfg.Server.PublicURL)
	cfg.Database.Path = os.ExpandEnv(cfg.Database.Path)
}
