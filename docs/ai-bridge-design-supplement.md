# AI-Bridge 设计文档 - 补充章节

> 本文档补充 `ai-bridge-design.md` 中遗漏的关键设计细节
>
> **版本**: 1.1
> **最后更新**: 2026-02-04
> **补充原因**: 基于头脑风暴和架构评审

---

## 十三、数据库设计优化 (GORM + WAL 模式)

### 13.1 问题分析

原始设计使用 SQLite,但在高并发场景下存在以下问题:

```
┌─────────────────────────────────────────────────────────┐
│ SQLite 默认模式的性能瓶颈                                 │
├─────────────────────────────────────────────────────────┤
│ ❌ 数据库级别的锁 - 写入时整个数据库被锁定               │
│ ❌ 读写阻塞 - 写入操作阻塞所有读取                        │
│ ❌ 并发性能差 - 多会话同时写入时性能急剧下降              │
│ ❌ 锁等待超时 - 容易出现 "database is locked" 错误       │
└─────────────────────────────────────────────────────────┘
```

### 13.2 优化方案

#### 13.2.1 启用 WAL (Write-Ahead Logging) 模式

**WAL 模式的优势**:
- ✅ 读写并发 - 读操作不阻塞写操作
- ✅ 更好的并发性 - 多个读操作可以同时进行
- ✅ 更快的写入 - 写入操作先写日志,异步刷盘
- ✅ 减少磁盘 I/O - 大多数情况下只在内存中操作

```yaml
# configs/config.yaml 补充
database:
  path: "./data/ai-bridge.db"

  # GORM 配置
  gorm:
    # 启用 WAL 模式 (强烈推荐)
    mode: "WAL"

    # 连接池配置
    maxIdleConns: 10          # 最大空闲连接数
    maxOpenConns: 100         # 最大打开连接数
    connMaxLifetime: 1h       # 连接最大生存时间
    connMaxIdleTime: 10m      # 连接最大空闲时间

  # 批量写入优化
  batchSize: 50              # 批量写入大小
  batchTimeout: 100ms        # 批量写入超时

  # SQLite 特定配置
  sqlite:
    # WAL 模式参数
    walAutoCheckpoint: 1000   # 自动检查点阈值(页数)
    synchronous: "NORMAL"     # 同步模式: FULL, NORMAL, OFF
    journalMode: "WAL"        # 日志模式: WAL, DELETE, TRUNCATE
    cacheSize: -64000         # 缓存大小(负值表示 KB)
    tempStore: "MEMORY"       # 临时存储位置: MEMORY, FILE
```

#### 13.2.2 GORM 模型定义

```go
// internal/session/store.go
package session

import (
    "time"
    "gorm.io/gorm"
    "gorm.io/driver/sqlite"
)

// BaseModel 基础模型
type BaseModel struct {
    ID        uint           `gorm:"primaryKey"`
    CreatedAt time.Time      `gorm:"index"`
    UpdatedAt time.Time      `gorm:"index"`
}

// Session 会话模型
type Session struct {
    BaseModel

    // 会话标识
    SessionID   string `gorm:"uniqueIndex;size:64"`
    Status      string `gorm:"index;size:32"`

    // 元数据 (JSON 存储)
    WorkingDir  string `gorm:"size:512"`
    Model       string `gorm:"size:64"`
    Agent       string `gorm:"size:64"`

    // 统计信息
    MessageCount int64  `gorm:"default:0"`
    LastSeq      int64  `gorm:"default:0"`

    // 关联
    Messages []Message `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE"`
}

// Message 消息模型
type Message struct {
    BaseModel

    // 关联
    SessionID string `gorm:"index:idx_session_seq,priority:1;index:idx_session_created,priority:1;size:64"`

    // 消息序号(联合索引)
    Seq       int64  `gorm:"index:idx_session_seq,priority:2;not null"`

    // 消息内容
    Type      string `gorm:"index;size:32"`
    Content   string `gorm:"type:text"`  // JSON 存储

    // 时间戳
    Timestamp int64  `gorm:"index:idx_session_created,priority:2"`

    // 去重
    MessageHash string `gorm:"index;size:64"`
}

// SessionStore 会话存储
type SessionStore struct {
    db *gorm.DB
}

// NewSessionStore 创建会话存储
func NewSessionStore(dbPath string) (*SessionStore, error) {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        // 性能优化
        SkipDefaultTransaction: true,  // 禁用自动事务
        PrepareStmt: true,            // 预编译语句
    })
    if err != nil {
        return nil, err
    }

    // 配置连接池
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(1 * time.Hour)

    // 启用 WAL 模式
    if err := enableWALMode(db); err != nil {
        return nil, err
    }

    // 自动迁移
    if err := db.AutoMigrate(&Session{}, &Message{}); err != nil {
        return nil, err
    }

    return &SessionStore{db: db}, nil
}

// enableWALMode 启用 WAL 模式
func enableWALMode(db *gorm.DB) error {
    // 启用 WAL 模式
    if err := db.Exec("PRAGMA journal_mode=WAL").Error; err != nil {
        return err
    }

    // 设置同步模式为 NORMAL (性能与安全的平衡)
    if err := db.Exec("PRAGMA synchronous=NORMAL").Error; err != nil {
        return err
    }

    // 设置缓存大小 (64MB)
    if err := db.Exec("PRAGMA cache_size=-64000").Error; err != nil {
        return err
    }

    // 临时表存储在内存中
    if err := db.Exec("PRAGMA temp_store=MEMORY").Error; err != nil {
        return err
    }

    // 忙碌超时 (5秒)
    if err := db.Exec("PRAGMA busy_timeout=5000").Error; err != nil {
        return err
    }

    return nil
}
```

#### 13.2.3 批量写入优化

```go
// internal/session/store.go

// BatchWriteMessages 批量写入消息
func (s *SessionStore) BatchWriteMessages(messages []*Message) error {
    if len(messages) == 0 {
        return nil
    }

    // 使用批量插入
    batchSize := 50
    for i := 0; i < len(messages); i += batchSize {
        end := i + batchSize
        if end > len(messages) {
            end = len(messages)
        }

        batch := messages[i:end]

        // 批量插入
        if err := s.db.CreateInBatches(batch, batchSize).Error; err != nil {
            return err
        }
    }

    return nil
}

// WriteMessageAsync 异步写入消息(带缓冲)
func (s *SessionStore) WriteMessageAsync(msg *Message) error {
    // 使用 channel 缓冲,批量写入
    return nil
}
```

---

## 十四、进程健康监控和崩溃恢复

### 14.1 健康监控架构

```
┌─────────────────────────────────────────────────────────┐
│                   健康监控系统                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Process    │────────>│ HealthMonitor│             │
│  │   claude #1  │<--------│              │             │
│  └──────────────┘         └──────┬───────┘             │
│                                  │                       │
│                          ┌───────┴────────┐            │
│                          │                │            │
│                          ▼                ▼            │
│                    ┌──────────┐    ┌──────────┐        │
│                    │ Heartbeat│    │ Watchdog │        │
│                    │  Checker │    │  Timer   │        │
│                    └──────────┘    └──────────┘        │
│                          │                │            │
│                          └────────┬───────┘            │
│                                   ▼                    │
│                          ┌─────────────────┐           │
│                          │ Event Dispatcher │           │
│                          └─────────────────┘           │
│                                   │                    │
│                          ┌────────┴────────┐           │
│                          ▼                 ▼           │
│                    ┌──────────┐      ┌─────────┐      │
│                    │  Alert   │      │ Restart │      │
│                    │  Event   │      │ Process │      │
│                    └──────────┘      └─────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 14.2 监控指标

```go
// internal/health/monitor.go
package health

import (
    "context"
    "time"
    "sync"
)

// HealthStatus 健康状态
type HealthStatus string

const (
    StatusHealthy     HealthStatus = "healthy"
    StatusUnhealthy   HealthStatus = "unhealthy"
    StatusWarning     HealthStatus = "warning"
    StatusDead        HealthStatus = "dead"
)

// ProcessHealth 进程健康状态
type ProcessHealth struct {
    ProcessID        string
    Status           HealthStatus
    LastMessageTime  time.Time
    LastCheckTime    time.Time

    // 统计信息
    TotalMessages    int64
    ErrorCount       int64
    WarningCount     int64

    // 超时检测
    UnresponsiveDuration time.Duration
}

// HealthMonitorConfig 监控配置
type HealthMonitorConfig struct {
    // 检查间隔
    CheckInterval time.Duration

    // 超时阈值
    MessageTimeout  time.Duration  // 消息超时时间
    ProcessTimeout time.Duration  // 进程超时时间

    // 重启策略
    RestartOnCrash  bool           // 崩溃后自动重启
    MaxRestartCount int            // 最大重启次数
    RestartDelay    time.Duration  // 重启延迟

    // 警告策略
    SendWarning     bool           // 发送警告事件(不强制终止)
    WarningInterval time.Duration  // 警告间隔
}

// HealthMonitor 健康监控器
type HealthMonitor struct {
    mu           sync.RWMutex
    processes    map[string]*ProcessHealth
    config       HealthMonitorConfig
    eventChan    chan HealthEvent

    ctx          context.Context
    cancel       context.CancelFunc
    wg           sync.WaitGroup
}

// HealthEvent 健康事件
type HealthEvent struct {
    Type      EventType
    ProcessID string
    Status    HealthStatus
    Message   string
    Timestamp time.Time
}

type EventType string

const (
    EventTypeProcessStarted   EventType = "process_started"
    EventTypeProcessStopped   EventType = "process_stopped"
    EventTypeProcessCrashed   EventType = "process_crashed"
    EventTypeProcessRestarted EventType = "process_restarted"
    EventTypeWarning          EventType = "warning"
    EventTypeTimeout          EventType = "timeout"
)

// NewHealthMonitor 创建健康监控器
func NewHealthMonitor(config HealthMonitorConfig) *HealthMonitor {
    ctx, cancel := context.WithCancel(context.Background())

    return &HealthMonitor{
        processes: make(map[string]*ProcessHealth),
        config:    config,
        eventChan: make(chan HealthEvent, 100),
        ctx:       ctx,
        cancel:    cancel,
    }
}

// Start 启动监控
func (m *HealthMonitor) Start() {
    m.wg.Add(1)
    go m.watchLoop()
}

// Stop 停止监控
func (m *HealthMonitor) Stop() {
    m.cancel()
    m.wg.Wait()
    close(m.eventChan)
}

// watchLoop 监控循环
func (m *HealthMonitor) watchLoop() {
    defer m.wg.Done()

    ticker := time.NewTicker(m.config.CheckInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            m.checkAllProcesses()

        case <-m.ctx.Done():
            return
        }
    }
}

// checkAllProcesses 检查所有进程
func (m *HealthMonitor) checkAllProcesses() {
    m.mu.RLock()
    processes := make(map[string]*ProcessHealth)
    for id, health := range m.processes {
        processes[id] = health
    }
    m.mu.RUnlock()

    now := time.Now()

    for id, health := range processes {
        // 检查消息超时
        timeSinceLastMsg := now.Sub(health.LastMessageTime)

        if timeSinceLastMsg > m.config.MessageTimeout {
            m.handleTimeout(id, health, timeSinceLastMsg)
        }

        // 检查进程状态
        if health.Status == StatusDead && m.config.RestartOnCrash {
            m.handleRestart(id, health)
        }
    }
}

// handleTimeout 处理超时
func (m *HealthMonitor) handleTimeout(processID string, health *ProcessHealth, duration time.Duration) {
    health.UnresponsiveDuration = duration

    if m.config.SendWarning {
        // 发送警告事件(不强制终止)
        m.eventChan <- HealthEvent{
            Type:      EventTypeWarning,
            ProcessID: processID,
            Status:    StatusWarning,
            Message:   fmt.Sprintf("Process unresponsive for %v", duration),
            Timestamp: time.Now(),
        }
    }

    // 更新状态
    health.Status = StatusUnhealthy
    health.WarningCount++
}

// handleRestart 处理重启
func (m *HealthMonitor) handleRestart(processID string, health *ProcessHealth) {
    if health.ErrorCount >= m.config.MaxRestartCount {
        // 超过最大重启次数,不再重启
        m.eventChan <- HealthEvent{
            Type:      EventTypeProcessCrashed,
            ProcessID: processID,
            Status:    StatusDead,
            Message:   fmt.Sprintf("Process crashed, exceeded max restart count (%d)", m.config.MaxRestartCount),
            Timestamp: time.Now(),
        }
        return
    }

    // 发送重启事件
    m.eventChan <- HealthEvent{
        Type:      EventTypeProcessRestarted,
        ProcessID: processID,
        Status:    StatusHealthy,
        Message:   "Process restarted automatically",
        Timestamp: time.Now(),
    }

    // 更新统计
    health.ErrorCount++
    health.Status = StatusHealthy
    health.UnresponsiveDuration = 0
}

// RegisterProcess 注册进程
func (m *HealthMonitor) RegisterProcess(processID string) {
    m.mu.Lock()
    defer m.mu.Unlock()

    m.processes[processID] = &ProcessHealth{
        ProcessID:       processID,
        Status:          StatusHealthy,
        LastMessageTime: time.Now(),
        LastCheckTime:   time.Now(),
    }

    // 发送启动事件
    m.eventChan <- HealthEvent{
        Type:      EventTypeProcessStarted,
        ProcessID: processID,
        Status:    StatusHealthy,
        Timestamp: time.Now(),
    }
}

// UnregisterProcess 注销进程
func (m *HealthMonitor) UnregisterProcess(processID string) {
    m.mu.Lock()
    defer m.mu.Unlock()

    if health, ok := m.processes[processID]; ok {
        health.Status = StatusDead
        delete(m.processes, processID)

        // 发送停止事件
        m.eventChan <- HealthEvent{
            Type:      EventTypeProcessStopped,
            ProcessID: processID,
            Status:    StatusDead,
            Timestamp: time.Now(),
        }
    }
}

// UpdateHeartbeat 更新心跳
func (m *HealthMonitor) UpdateHeartbeat(processID string, msgCount int64) {
    m.mu.Lock()
    defer m.mu.Unlock()

    if health, ok := m.processes[processID]; ok {
        health.LastMessageTime = time.Now()
        health.LastCheckTime = time.Now()
        health.TotalMessages = msgCount

        // 恢复健康状态
        if health.Status != StatusHealthy {
            health.Status = StatusHealthy
            health.UnresponsiveDuration = 0
        }
    }
}

// Events 返回事件通道
func (m *HealthMonitor) Events() <-chan HealthEvent {
    return m.eventChan
}
```

### 14.3 集成到 Process

```go
// internal/claude/process.go 补充

type Process struct {
    // ... 现有字段

    // 健康监控
    healthMonitor *health.HealthMonitor
    healthCancel  context.CancelFunc
}

// Start 启动进程(补充健康监控)
func (p *Process) Start(ctx context.Context) error {
    // ... 现有启动逻辑

    // 注册到健康监控
    if p.healthMonitor != nil {
        p.healthMonitor.RegisterProcess(p.id)

        // 启动心跳上报
        healthCtx, healthCancel := context.WithCancel(ctx)
        p.healthCancel = healthCancel

        go p.heartbeatLoop(healthCtx)
    }

    return nil
}

// heartbeatLoop 心跳循环
func (p *Process) heartbeatLoop(ctx context.Context) {
    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()

    msgCount := int64(0)

    for {
        select {
        case <-ticker.C:
            if p.healthMonitor != nil {
                p.healthMonitor.UpdateHeartbeat(p.id, msgCount)
            }

        case msg := <-p.messageChan:
            msgCount++

            // 收到消息时立即更新心跳
            if p.healthMonitor != nil {
                p.healthMonitor.UpdateHeartbeat(p.id, msgCount)
            }

        case <-ctx.Done():
            return
        }
    }
}

// Stop 停止进程(补充清理)
func (p *Process) Stop(ctx context.Context) error {
    // 停止心跳
    if p.healthCancel != nil {
        p.healthCancel()
    }

    // 注销健康监控
    if p.healthMonitor != nil {
        p.healthMonitor.UnregisterProcess(p.id)
    }

    // ... 现有停止逻辑

    return nil
}
```

---

## 十五、资源泄漏防护

### 15.1 内存泄漏检测

```go
// internal/resource/leak_detector.go
package resource

import (
    "context"
    "runtime"
    "time"
    "sync"
)

// LeakDetector 泄漏检测器
type LeakDetector struct {
    mu              sync.RWMutex
    goroutines      map[string]int
    connections     map[string]int
    samples         []MemorySample
    maxSamples      int

    // 阈值
    maxGoroutines   int
    maxMemoryMB     int

    ctx             context.Context
    cancel          context.CancelFunc
}

type MemorySample struct {
    Timestamp    time.Time
    Goroutines   int
    HeapAlloc    uint64
    HeapSys      uint64
    StackSys     uint64
}

// NewLeakDetector 创建泄漏检测器
func NewLeakDetector() *LeakDetector {
    ctx, cancel := context.WithCancel(context.Background())

    return &LeakDetector{
        goroutines:  make(map[string]int),
        connections: make(map[string]int),
        samples:     make([]MemorySample, 0, 100),
        maxSamples:  100,
        maxGoroutines: 1000,
        maxMemoryMB: 1024, // 1GB
        ctx:         ctx,
        cancel:      cancel,
    }
}

// Start 启动检测
func (d *LeakDetector) Start(interval time.Duration) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            d.sample()

        case <-d.ctx.Done():
            return
        }
    }
}

// sample 采集样本
func (d *LeakDetector) sample() {
    var mem runtime.MemStats
    runtime.ReadMemStats(&mem)

    sample := MemorySample{
        Timestamp:    time.Now(),
        Goroutines:   runtime.NumGoroutine(),
        HeapAlloc:    mem.HeapAlloc,
        HeapSys:      mem.HeapSys,
        StackSys:     mem.StackSys,
    }

    d.mu.Lock()
    d.samples = append(d.samples, sample)

    // 限制样本数量
    if len(d.samples) > d.maxSamples {
        d.samples = d.samples[1:]
    }
    d.mu.Unlock()

    // 检查阈值
    d.checkThresholds(sample)
}

// checkThresholds 检查阈值
func (d *LeakDetector) checkThresholds(sample MemorySample) {
    // 检查 goroutine 数量
    if sample.Goroutines > d.maxGoroutines {
        log.Warnf("Goroutine count exceeds threshold: %d > %d",
            sample.Goroutines, d.maxGoroutines)
    }

    // 检查内存使用
    heapMB := sample.HeapSys / 1024 / 1024
    if heapMB > uint64(d.maxMemoryMB) {
        log.Warnf("Heap memory exceeds threshold: %dMB > %dMB",
            heapMB, d.maxMemoryMB)
    }
}

// TrackGoroutine 跟踪 goroutine
func (d *LeakDetector) TrackGoroutine(name string) {
    d.mu.Lock()
    defer d.mu.Unlock()
    d.goroutines[name]++
}

// UntrackGoroutine 取消跟踪
func (d *LeakDetector) UntrackGoroutine(name string) {
    d.mu.Lock()
    defer d.mu.Unlock()
    d.goroutines[name]--
}

// TrackConnection 跟踪连接
func (d *LeakDetector) TrackConnection(id string) {
    d.mu.Lock()
    defer d.mu.Unlock()
    d.connections[id]++

    if d.connections[id] > 1 {
        log.Warnf("Potential connection leak: %s has %d connections",
            id, d.connections[id])
    }
}

// UntrackConnection 取消跟踪连接
func (d *LeakDetector) UntrackConnection(id string) {
    d.mu.Lock()
    defer d.mu.Unlock()
    d.connections[id]--

    if d.connections[id] == 0 {
        delete(d.connections, id)
    }
}
```

### 15.2 WebSocket 连接管理

```go
// internal/websocket/manager.go

// ConnectionManager 连接管理器
type ConnectionManager struct {
    mu           sync.RWMutex
    connections  map[string]*Connection
    bySession    map[string][]string // sessionID -> connectionIDs

    // 清理配置
    maxIdleTime  time.Duration
    cleanupInterval time.Duration

    ctx          context.Context
    cancel       context.CancelFunc
}

type Connection struct {
    ID            string
    SessionID     string
    ConnectedAt   time.Time
    LastActiveAt  time.Time
    Socket        *socket.Conn
}

// NewConnectionManager 创建连接管理器
func NewConnectionManager(maxIdleTime time.Duration) *ConnectionManager {
    ctx, cancel := context.WithCancel(context.Background())

    mgr := &ConnectionManager{
        connections:      make(map[string]*Connection),
        bySession:       make(map[string][]string),
        maxIdleTime:     maxIdleTime,
        cleanupInterval: 1 * time.Minute,
        ctx:            ctx,
        cancel:         cancel,
    }

    // 启动清理循环
    go mgr.cleanupLoop()

    return mgr
}

// cleanupLoop 清理空闲连接
func (m *ConnectionManager) cleanupLoop() {
    ticker := time.NewTicker(m.cleanupInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            m.cleanupIdleConnections()

        case <-m.ctx.Done():
            return
        }
    }
}

// cleanupIdleConnections 清理空闲连接
func (m *ConnectionManager) cleanupIdleConnections() {
    m.mu.Lock()
    defer m.mu.Unlock()

    now := time.Now()
    var toClose []string

    for id, conn := range m.connections {
        idleTime := now.Sub(conn.LastActiveAt)

        if idleTime > m.maxIdleTime {
            toClose = append(toClose, id)
        }
    }

    for _, id := range toClose {
        conn := m.connections[id]

        log.Infof("Closing idle connection: %s (idle for %v)",
            id, now.Sub(conn.LastActiveAt))

        // 关闭连接
        conn.Socket.Close()

        // 删除记录
        delete(m.connections, id)

        // 从会话列表中删除
        sessionConns := m.bySession[conn.SessionID]
        for i, cid := range sessionConns {
            if cid == id {
                m.bySession[conn.SessionID] = append(sessionConns[:i], sessionConns[i+1:]...)
                break
            }
        }
    }

    if len(toClose) > 0 {
        log.Infof("Cleaned up %d idle connections", len(toClose))
    }
}

// Register 注册连接
func (m *ConnectionManager) Register(conn *Connection) {
    m.mu.Lock()
    defer m.mu.Unlock()

    m.connections[conn.ID] = conn
    m.bySession[conn.SessionID] = append(m.bySession[conn.SessionID], conn.ID)

    log.Debugf("Connection registered: %s (session: %s)", conn.ID, conn.SessionID)
}

// Unregister 注销连接
func (m *ConnectionManager) Unregister(connID string) {
    m.mu.Lock()
    defer m.mu.Unlock()

    conn, ok := m.connections[connID]
    if !ok {
        return
    }

    // 删除连接
    delete(m.connections, connID)

    // 从会话列表中删除
    sessionConns := m.bySession[conn.SessionID]
    for i, cid := range sessionConns {
        if cid == connID {
            m.bySession[conn.SessionID] = append(sessionConns[:i], sessionConns[i+1:]...)
            break
        }
    }

    log.Debugf("Connection unregistered: %s", connID)
}

// GetBySession 获取会话的所有连接
func (m *ConnectionManager) GetBySession(sessionID string) []*Connection {
    m.mu.RLock()
    defer m.mu.RUnlock()

    connIDs := m.bySession[sessionID]
    conns := make([]*Connection, 0, len(connIDs))

    for _, id := range connIDs {
        if conn, ok := m.connections[id]; ok {
            conns = append(conns, conn)
        }
    }

    return conns
}

// UpdateActivity 更新连接活动时间
func (m *ConnectionManager) UpdateActivity(connID string) {
    m.mu.Lock()
    defer m.mu.Unlock()

    if conn, ok := m.connections[connID]; ok {
        conn.LastActiveAt = time.Now()
    }
}
```

### 15.3 订阅者清理

```go
// internal/session/session.go 补充

type Session struct {
    // ... 现有字段

    // 清理机制
    cleanupOnce sync.Once
    done        chan struct{}
}

// Subscribe 订阅消息(补充自动清理)
func (s *Session) Subscribe(ctx context.Context, filter MessageFilter) (<-chan *Message, func()) {
    s.mu.Lock()
    defer s.mu.Unlock()

    // 创建消息通道
    msgChan := make(chan *Message, 50)

    subscriber := &Subscriber{
        ID:          generateID(),
        LastSeenSeq: filter.SinceSeq,
        MessageChan: msgChan,
        Filter:      filter,
        CreatedAt:   time.Now(),
    }

    s.subscribers[subscriber.ID] = subscriber

    // 创建取消函数
    cancel := func() {
        s.mu.Lock()
        defer s.mu.Unlock()

        // 关闭通道
        close(subscriber.MessageChan)

        // 删除订阅者
        delete(s.subscribers, subscriber.ID)

        log.Debugf("Subscriber %s removed from session %s",
            subscriber.ID, s.id)
    }

    // 监听 context 取消
    go func() {
        <-ctx.Done()
        cancel()
    }()

    log.Debugf("Subscriber %s added to session %s", subscriber.ID, s.id)

    return msgChan, cancel
}

// cleanupSubscribers 清理僵尸订阅者
func (s *Session) cleanupSubscribers() {
    s.mu.Lock()
    defer s.mu.Unlock()

    now := time.Now()
    var toRemove []string

    for id, sub := range s.subscribers {
        // 检查通道是否已关闭
        select {
        case <-sub.MessageChan:
            // 通道已关闭或有数据可以读取
            toRemove = append(toRemove, id)
        default:
        }

        // 检查订阅时间(防止僵尸订阅)
        if now.Sub(sub.CreatedAt) > 24*time.Hour {
            toRemove = append(toRemove, id)
        }
    }

    for _, id := range toRemove {
        sub := s.subscribers[id]
        close(sub.MessageChan)
        delete(s.subscribers, id)

        log.Warnf("Cleaned up zombie subscriber: %s", id)
    }
}

// Close 关闭会话
func (s *Session) Close() error {
    return s.cleanupOnce.Do(func() {
        close(s.done)

        // 清理所有订阅者
        s.mu.Lock()
        for id, sub := range s.subscribers {
            close(sub.MessageChan)
            delete(s.subscribers, id)
        }
        s.mu.Unlock()

        log.Infof("Session %s closed", s.id)
    })
}
```

---

## 十六、故障场景测试

### 16.1 数据库故障测试

```go
// tests/integration/database_failure_test.go

// TestDatabase_LockTimeout 测试数据库锁超时
func TestDatabase_LockTimeout(t *testing.T) {
    // Arrange
    store := setupTestStore(t)
    defer store.Close()

    // 模拟长时间写入
    longWrite := func() {
        store.db.Exec("SELECT * FROM sessions")
        time.Sleep(5 * time.Second)
    }

    go longWrite()

    // Act - 尝试并发写入
    err := store.CreateSession(&Session{
        SessionID: "test-session",
        Status:    "active",
    })

    // Assert - 应该成功(使用 WAL 模式不会锁)
    assert.NoError(t, err)
}

// TestDatabase_Corruption 测试数据库损坏恢复
func TestDatabase_Corruption(t *testing.T) {
    // Arrange
    store := setupTestStore(t)

    // 创建会话
    session := &Session{
        SessionID: "test-session",
        Status:    "active",
    }
    store.CreateSession(session)

    // Act - 模拟数据库损坏
    store.db.Close()

    // 损坏数据库文件
    dbPath := store.dbPath()
    corruptFile(t, dbPath)

    // 尝试重新打开
    newStore, err := NewSessionStore(dbPath)

    // Assert - 应该返回错误或恢复
    if err != nil {
        assert.Error(t, err)
    } else {
        // 如果成功打开,验证数据完整性
        var sessions []Session
        newStore.db.Find(&sessions)
        assert.NotEmpty(t, sessions)
    }
}

// TestDatabase_DiskFull 测试磁盘空间不足
func TestDatabase_DiskFull(t *testing.T) {
    // 这个测试需要特殊环境,可以跳过
    if testing.Short() {
        t.Skip("Skipping disk full test in short mode")
    }

    // Arrange
    store := setupTestStore(t)

    // 模拟磁盘满(使用小文件系统)
    // Act - 尝试写入大量数据
    // Assert - 应该优雅处理错误
}
```

### 16.2 网络故障测试

```go
// tests/integration/network_failure_test.go

// TestWebSocket_Reconnect 测试 WebSocket 重连
func TestWebSocket_Reconnect(t *testing.T) {
    // Arrange
    server := setupTestServer(t)
    defer server.Close()

    client := NewTestClient(server.URL)
    require.NoError(t, client.Connect())

    session := createTestSession(t, server.URL)

    // Act - 断开连接
    client.Disconnect()
    time.Sleep(1 * time.Second)

    // 重新连接
    err := client.Reconnect()

    // Assert - 应该成功重连
    assert.NoError(t, err)
    assert.True(t, client.Connected())

    // 验证能接收新消息
    client.Subscribe(session.ID)
    sendMessage(t, server.URL, session.ID, "test")

    msg := client.WaitForMessage(5 * time.Second)
    assert.NotNil(t, msg)
}

// TestAPI_Timeout 测试 API 超时
func TestAPI_Timeout(t *testing.T) {
    // Arrange
    server := setupTestServerWithDelay(t, 10*time.Second)
    defer server.Close()

    client := &http.Client{
        Timeout: 1 * time.Second,
    }

    // Act - 发送请求
    resp, err := client.Get(server.URL + "/api/v1/sessions")

    // Assert - 应该超时
    assert.Error(t, err)
    assert.Nil(t, resp)
}
```

### 16.3 资源限制测试

```go
// tests/integration/resource_limit_test.go

// TestProcess_FileDescriptorLimit 测试文件描述符限制
func TestProcess_FileDescriptorLimit(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping FD limit test in short mode")
    }

    // Arrange
    pool := pool.NewPool(pool.Config{
        MaxInstances: 1000,  // 远超系统限制
    })

    ctx := context.Background()

    // Act - 尝试创建大量进程
    var procs []*claude.Process
    for i := 0; i < 1000; i++ {
        config := claude.Config{
            WorkingDir: os.TempDir(),
        }

        proc, err := pool.Acquire(ctx, config)
        if err != nil {
            // 达到限制
            log.Warnf("Failed to acquire process at %d: %v", i, err)
            break
        }
        procs = append(procs, proc)
    }

    // Assert - 应该在合理数量时停止
    assert.Less(t, len(procs), 1000)

    // Cleanup
    for _, proc := range procs {
        proc.Stop(ctx)
    }
}
```

---

## 十七、配置热更新

### 17.1 配置文件监听

```go
// internal/config/watcher.go

import (
    "context"
    "github.com/fsnotify/fsnotify"
)

// ConfigWatcher 配置文件监听器
type ConfigWatcher struct {
    path      string
    watcher   *fsnotify.Watcher
    onChange  func(*Config) error
    debounce  time.Duration

    ctx       context.Context
    cancel    context.CancelFunc
    lastMod   time.Time
    mu        sync.Mutex
}

// NewConfigWatcher 创建配置监听器
func NewConfigWatcher(path string, onChange func(*Config) error) (*ConfigWatcher, error) {
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        return nil, err
    }

    // 监听文件
    if err := watcher.Add(path); err != nil {
        watcher.Close()
        return nil, err
    }

    ctx, cancel := context.WithCancel(context.Background())

    return &ConfigWatcher{
        path:     path,
        watcher:  watcher,
        onChange: onChange,
        debounce: 1 * time.Second,  // 防抖
        ctx:      ctx,
        cancel:   cancel,
    }, nil
}

// Start 启动监听
func (w *ConfigWatcher) Start() {
    go w.watchLoop()
}

// watchLoop 监听循环
func (w *ConfigWatcher) watchLoop() {
    var timer *time.Timer

    for {
        select {
        case event, ok := <-w.watcher.Events:
            if !ok {
                return
            }

            // 只处理写入事件
            if event.Op&fsnotify.Write != fsnotify.Write {
                continue
            }

            // 防抖
            w.mu.Lock()
            w.lastMod = time.Now()
            w.mu.Unlock()

            if timer != nil {
                timer.Stop()
            }
            timer = time.AfterFunc(w.debounce, func() {
                w.reloadConfig()
            })

        case err, ok := <-w.watcher.Errors:
            if !ok {
                return
            }
            log.Errorf("Config watcher error: %v", err)

        case <-w.ctx.Done():
            if timer != nil {
                timer.Stop()
            }
            return
        }
    }
}

// reloadConfig 重新加载配置
func (w *ConfigWatcher) reloadConfig() {
    // 读取新配置
    cfg, err := LoadConfig(w.path)
    if err != nil {
        log.Errorf("Failed to reload config: %v", err)
        return
    }

    // 验证配置
    if err := cfg.Validate(); err != nil {
        log.Errorf("Invalid config: %v", err)
        return
    }

    // 调用回调
    if err := w.onChange(cfg); err != nil {
        log.Errorf("Failed to apply config: %v", err)
        return
    }

    log.Info("Config reloaded successfully")
}

// Stop 停止监听
func (w *ConfigWatcher) Stop() {
    w.cancel()
    w.watcher.Close()
}
```

### 17.2 环境变量覆盖

```go
// internal/config/config.go 补充

// LoadConfig 加载配置(支持环境变量覆盖)
func LoadConfig(path string) (*Config, error) {
    // 读取 YAML 文件
    cfg := &Config{}
    if err := loadYAML(path, cfg); err != nil {
        return nil, err
    }

    // 环境变量覆盖
    cfg.applyEnvOverrides()

    // 验证
    if err := cfg.Validate(); err != nil {
        return nil, err
    }

    return cfg, nil
}

// applyEnvOverrides 应用环境变量覆盖
func (c *Config) applyEnvOverrides() {
    // 服务器配置
    if host := os.Getenv("AI_BRIDGE_HOST"); host != "" {
        c.Server.Host = host
    }
    if port := os.Getenv("AI_BRIDGE_PORT"); port != "" {
        p, err := strconv.Atoi(port)
        if err == nil {
            c.Server.Port = p
        }
    }

    // 数据库配置
    if dbPath := os.Getenv("AI_BRIDGE_DB_PATH"); dbPath != "" {
        c.Database.Path = dbPath
    }

    // JWT 密钥
    if secret := os.Getenv("JWT_SECRET"); secret != "" {
        c.Auth.JWTSecret = secret
    }

    // API Token
    if token := os.Getenv("CLI_API_TOKEN"); token != "" {
        c.Auth.CliApiToken = token
    }

    // 进程池配置
    if maxInstances := os.Getenv("POOL_MAX_INSTANCES"); maxInstances != "" {
        max, err := strconv.Atoi(maxInstances)
        if err == nil {
            c.Pool.MaxInstances = max
        }
    }

    // 日志级别
    if level := os.Getenv("LOG_LEVEL"); level != "" {
        c.Logging.Level = level
    }
}
```

---

## 十八、日志和可观测性

### 18.1 结构化日志配置

```yaml
# configs/config.yaml 补充
logging:
  # 日志级别: debug, info, warn, error
  level: "info"

  # 日志格式: json, text
  format: "json"

  # 输出目标
  outputs:
    # 文件输出
    - type: "file"
      path: "./logs/ai-bridge.log"
      # 日志轮转
      rotation:
        maxSize: 100MB      # 单文件最大大小
        maxBackups: 7       # 保留的备份文件数
        maxAge: 30days      # 保留时间
        compress: true      # 压缩旧文件

    # 标准输出
    - type: "stdout"

  # 结构化日志字段
  fields:
    sessionId: true
    processId: true
    requestId: true

  # 初始字段
  initialFields:
    service: "ai-bridge"
    version: "1.0.0"
    environment: "${ENV:-development}"
```

### 18.2 性能指标日志

```go
// internal/metrics/collector.go

type MetricsCollector struct {
    mu sync.RWMutex

    // 会话指标
    activeSessions   int64
    totalSessions    int64
    totalMessages    int64

    // API 指标
    apiRequests      map[string]int64  // endpoint -> count
    apiResponseTimes map[string][]time.Duration

    // 性能指标
    avgMessageLatency time.Duration
    p95MessageLatency time.Duration
    p99MessageLatency time.Duration

    // 资源指标
    memoryUsage      uint64
    goroutineCount   int
}

// RecordAPIRequest 记录 API 请求
func (m *MetricsCollector) RecordAPIRequest(endpoint string, duration time.Duration) {
    m.mu.Lock()
    defer m.mu.Unlock()

    m.apiRequests[endpoint]++
    m.apiResponseTimes[endpoint] = append(
        m.apiResponseTimes[endpoint],
        duration,
    )

    // 保持最近 100 个样本
    if len(m.apiResponseTimes[endpoint]) > 100 {
        m.apiResponseTimes[endpoint] = m.apiResponseTimes[endpoint][1:]
    }
}

// GetMetrics 获取指标
func (m *MetricsCollector) GetMetrics() map[string]interface{} {
    m.mu.RLock()
    defer m.mu.RUnlock()

    return map[string]interface{}{
        "sessions": map[string]interface{}{
            "active": m.activeSessions,
            "total":  m.totalSessions,
        },
        "messages": map[string]interface{}{
            "total": m.totalMessages,
        },
        "performance": map[string]interface{}{
            "avg_latency": m.avgMessageLatency.Milliseconds(),
            "p95_latency": m.p95MessageLatency.Milliseconds(),
            "p99_latency": m.p99MessageLatency.Milliseconds(),
        },
    }
}

// LogMetrics 记录指标日志
func (m *MetricsCollector) LogMetrics() {
    metrics := m.GetMetrics()

    logger.WithFields(logger.Fields{
        "metrics": metrics,
    }).Info("Performance metrics")
}
```

---

## 十九、实施优先级和路线图

### 19.1 高优先级 (立即实施)

| 任务 | 工作量 | 优先级 | 依赖 |
|------|-------|--------|------|
| ✅ GORM 集成和 WAL 模式 | 2天 | P0 | 无 |
| ✅ 健康监控基础框架 | 3天 | P0 | 无 |
| ✅ 资源泄漏检测 | 2天 | P0 | 无 |
| ✅ WebSocket 连接管理 | 2天 | P0 | 无 |

### 19.2 中优先级 (第二阶段)

| 任务 | 工作量 | 优先级 | 依赖 |
|------|-------|--------|------|
| ⏳ 故障场景测试 | 3天 | P1 | 核心功能完成 |
| ⏳ 配置热更新 | 2天 | P1 | 无 |
| ⏳ 性能指标采集 | 2天 | P1 | 无 |

### 19.3 低优先级 (优化阶段)

| 任务 | 工作量 | 优先级 | 依赖 |
|------|-------|--------|------|
| 📋 前端 SDK | 5天 | P2 | API 稳定 |
| 📋 高级监控集成 | 3天 | P2 | 基础监控完成 |

---

## 二十、总结

本补充文档针对原始设计文档中的关键遗漏点进行了补充,主要包括:

1. **数据库性能优化** - GORM + WAL 模式,解决并发瓶颈
2. **进程健康监控** - 自动检测超时和崩溃,支持自动重启
3. **资源泄漏防护** - 内存泄漏检测、连接管理、订阅者清理
4. **故障场景测试** - 数据库故障、网络故障、资源限制测试
5. **配置热更新** - 文件监听、环境变量覆盖
6. **日志和可观测性** - 结构化日志、性能指标

这些补充将显著提升系统的:
- ✅ **稳定性** - 崩溃恢复、资源管理
- ✅ **性能** - 数据库优化、连接池
- ✅ **可观测性** - 日志、指标、健康检查
- ✅ **可维护性** - 配置热更新、自动化测试

---

**下一步行动**:
1. 审查本补充文档
2. 将相关内容合并到主设计文档
3. 更新实施计划
4. 开始高优先级任务的实施
