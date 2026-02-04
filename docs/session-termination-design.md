# AI-Bridge 会话状态跟踪和手动终止设计

> 本文档定义会话状态跟踪、超时显示和手动终止功能
>
> **版本**: 1.0
> **最后更新**: 2026-02-04
> **需求来源**: 前端需要知道当前对话进行了多久,并能手动终止

---

## 一、设计目标

### 1.1 核心需求

```
┌─────────────────────────────────────────────────────────┐
│              会话状态跟踪和手动终止                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ 实时显示当前对话进行了多久                            │
│  ✅ 前端可基于时间显示"正在思考..."状态                    │
│  ✅ 提供手动终止接口(类似 Claude Code 的 ESC)            │
│  ✅ 不自动超时停止(AI 思考时间不可控)                      │
│  ✅ 记录每条消息的处理时长                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 使用场景

**场景 1: 前端显示处理时长**
```javascript
// 前端轮询获取会话状态
const status = await getSessionStatus(sessionId);

// 显示给用户
if (status.state === 'processing') {
  console.log(`正在思考中... 已用时 ${status.duration}ms`);

  // 超过 30 秒显示警告
  if (status.duration > 30000) {
    showWarning('AI 正在深度思考,请耐心等待...');
  }
}
```

**场景 2: 手动终止长时间任务**
```javascript
// 用户点击"停止"按钮
await stopSession(sessionId);

// 或者类似 Claude Code 的 ESC 键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    stopSession(sessionId);
  }
});
```

---

## 二、会话状态模型

### 2.1 会话状态枚举

```go
// pkg/protocol/types.go

// SessionState 会话状态
type SessionState string

const (
    StateIdle        SessionState = "idle"         // 空闲,等待用户输入
    StateProcessing  SessionState = "processing"   // AI 正在处理
    StateWaiting     SessionState = "waiting"      // 等待权限批准
    StateError       SessionState = "error"        // 错误状态
    StateStopped     SessionState = "stopped"      // 已停止
)

// String 返回状态的字符串表示
func (s SessionState) String() string {
    return string(s)
}
```

### 2.2 会话状态结构

```go
// pkg/protocol/types.go

// SessionStatus 会话状态信息
type SessionStatus struct {
    // 会话标识
    SessionID string        `json:"sessionId"`

    // 当前状态
    State     SessionState  `json:"state"`

    // 时间信息
    Duration  int64         `json:"duration"`   // 当前状态持续时长(毫秒)
    StartTime int64         `json:"startTime"`  // 当前状态开始时间(Unix 时间戳)

    // 最后一条消息信息
    LastMessageSeq    int64  `json:"lastMessageSeq"`    // 最后一条消息序号
    LastMessageType   string `json:"lastMessageType"`   // 最后一条消息类型
    LastMessageTime   int64  `json:"lastMessageTime"`   // 最后一条消息时间

    // 统计信息
    TotalMessages     int64  `json:"totalMessages"`     // 总消息数
    ProcessingCount   int64  `json:"processingCount"`   // 正在处理的消息数

    // 错误信息(如果有)
    Error     string       `json:"error,omitempty"`
    ErrorCode string       `json:"errorCode,omitempty"`

    // 元数据
    Metadata  SessionMetadata `json:"metadata,omitempty"`
}

// SessionMetadata 会话元数据
type SessionMetadata struct {
    WorkingDir    string `json:"workingDirectory"`
    Model         string `json:"model"`
    Agent         string `json:"agent"`
    PermissionMode string `json:"permissionMode"`
}
```

### 2.3 消息处理时长

```go
// pkg/protocol/types.go

// Message 消息结构(补充)
type Message struct {
    Seq       int64       `json:"seq"`
    Type      MessageType `json:"type"`
    Content   interface{} `json:"content"`
    Timestamp time.Time   `json:"timestamp"`

    // 新增: 处理时长
    ProcessingDuration int64  `json:"processingDuration,omitempty"` // 处理时长(毫秒)
    ProcessingStarted  int64  `json:"processingStarted,omitempty"`  // 开始处理时间
    ProcessingEnded    int64  `json:"processingEnded,omitempty"`    // 结束处理时间

    // 状态(仅用于 processing 类型的消息)
    Status string `json:"status,omitempty"` // "started", "in_progress", "completed", "failed"
}
```

---

## 三、会话状态跟踪实现

### 3.1 Session 层面的状态跟踪

```go
// internal/session/session.go

type Session struct {
    id            string
    process       *claude.Process
    createdAt     time.Time

    // 状态跟踪
    mu            sync.RWMutex
    state         SessionState
    stateStartAt  time.Time     // 当前状态开始时间
    stateDuration time.Duration // 当前状态持续时长

    // 消息处理时间
    currentMessageSeq  int64             // 当前正在处理的消息序号
    messageStartTimes  map[int64]time.Time // 消息开始处理时间
    messageDurations   map[int64]time.Duration // 消息处理时长

    // ... 其他现有字段
}

// GetStatus 获取会话状态
func (s *Session) GetStatus() *protocol.SessionStatus {
    s.mu.RLock()
    defer s.mu.RUnlock()

    // 计算当前状态持续时长
    duration := time.Since(s.stateStartAt).Milliseconds()

    status := &protocol.SessionStatus{
        SessionID:       s.id,
        State:           s.state,
        Duration:        duration,
        StartTime:       s.stateStartAt.Unix(),
        LastMessageSeq:  s.lastSeq,
        TotalMessages:   s.messageCount,
        ProcessingCount: int64(len(s.messageStartTimes)),
    }

    // 获取最后一条消息信息
    if len(s.recentMessages) > 0 {
        lastMsg := s.recentMessages[0]
        status.LastMessageType = string(lastMsg.Type)
        status.LastMessageTime = lastMsg.Timestamp.Unix()
    }

    // 如果正在处理消息,添加处理时长
    if s.state == protocol.StateProcessing && s.currentMessageSeq > 0 {
        if startTime, ok := s.messageStartTimes[s.currentMessageSeq]; ok {
            status.ProcessingDuration = time.Since(startTime).Milliseconds()
        }
    }

    return status
}

// setState 设置状态
func (s *Session) setState(state SessionState) {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.state = state
    s.stateStartAt = time.Now()
    s.stateDuration = 0

    logger.Infof("Session %s state changed to %s", s.id, state)
}

// startProcessing 开始处理消息
func (s *Session) startProcessing(seq int64) {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.state = protocol.StateProcessing
    s.stateStartAt = time.Now()
    s.currentMessageSeq = seq
    s.messageStartTimes[seq] = time.Now()

    logger.Debugf("Session %s started processing message %d", s.id, seq)
}

// completeProcessing 完成处理消息
func (s *Session) completeProcessing(seq int64) {
    s.mu.Lock()
    defer s.mu.Unlock()

    if startTime, ok := s.messageStartTimes[seq]; ok {
        duration := time.Since(startTime)
        s.messageDurations[seq] = duration

        logger.Infof("Session %s completed message %d in %v",
            s.id, seq, duration)

        delete(s.messageStartTimes, seq)
    }

    s.currentMessageSeq = 0

    // 如果没有正在处理的消息,回到空闲状态
    if len(s.messageStartTimes) == 0 {
        s.state = protocol.StateIdle
        s.stateStartAt = time.Now()
    }
}
```

### 3.2 Process 层面的消息处理

```go
// internal/claude/process.go

type Process struct {
    // ... 现有字段

    // 消息处理回调
    onMessageStarted  func(seq int64)
    onMessageEnded    func(seq int64, duration time.Duration)
}

// SendMessage 发送消息
func (p *Process) SendMessage(ctx context.Context, text string) error {
    p.mu.Lock()
    if !p.running {
        p.mu.Unlock()
        return fmt.Errorf("process not running")
    }
    p.mu.Unlock()

    // 生成消息序号
    seq := p.nextSeq()

    // 回调: 开始处理
    if p.onMessageStarted != nil {
        p.onMessageStarted(seq)
    }
    startTime := time.Now()

    // 写入 stdin
    if _, err := fmt.Fprintln(p.stdin, text); err != nil {
        return fmt.Errorf("failed to send message: %w", err)
    }

    return nil
}

// readOutputLoop 读取输出循环(补充回调)
func (p *Process) readOutputLoop() {
    scanner := bufio.NewScanner(p.stdout)

    for scanner.Scan() {
        line := scanner.Text()

        // 解析消息
        msg, err := p.parseMessage(line)
        if err != nil {
            continue
        }

        // 检查消息是否完成
        if p.isMessageComplete(msg) {
            endTime := time.Now()
            duration := endTime.Sub(startTime)

            // 回调: 消息处理完成
            if p.onMessageEnded != nil {
                p.onMessageEnded(msg.Seq, duration)
            }
        }

        // 发送到消息通道
        p.messageChan <- msg
    }
}

// nextSeq 生成下一个序号
func (p *Process) nextSeq() int64 {
    return atomic.AddInt64(&p.lastSeq, 1)
}
```

---

## 四、手动终止功能

### 4.1 终止信号实现

```go
// internal/claude/process.go

// Interrupt 发送中断信号(类似 ESC)
func (p *Process) Interrupt(ctx context.Context) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    logger.Infof("Sending interrupt signal to process %s", p.id)

    // 方式1: 发送 ESC 字符到 stdin
    // Claude Code CLI 监听 ESC 键来中断当前操作
    if _, err := p.stdin.Write([]byte{0x1b}); err != nil {
        return fmt.Errorf("failed to send ESC: %w", err)
    }

    // 方式2: 发送 Ctrl+C (如果 ESC 不起作用)
    // if _, err := p.stdin.Write([]byte{0x03}); err != nil {
    //     return fmt.Errorf("failed to send Ctrl+C: %w", err)
    // }

    // 方式3: 在 Windows 上可能需要发送其他信号
    // runtime.GOOS == "windows" ...

    return nil
}

// Signal 发送系统信号(更强制)
func (p *Process) Signal(ctx context.Context, sig syscall.Signal) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    if p.cmd.Process == nil {
        return fmt.Errorf("process not started")
    }

    logger.Infof("Sending signal %v to process %s", sig, p.id)

    // 发送信号
    if err := p.cmd.Process.Signal(sig); err != nil {
        return fmt.Errorf("failed to send signal: %w", err)
    }

    return nil
}
```

### 4.2 Session 层的终止

```go
// internal/session/session.go

// Stop 停止当前正在处理的消息
func (s *Session) Stop(ctx context.Context) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    // 检查状态
    if s.state != protocol.StateProcessing && s.state != protocol.StateWaiting {
        return fmt.Errorf("session is not processing (current state: %s)", s.state)
    }

    logger.Infof("Stopping session %s (current state: %s)", s.id, s.state)

    // 发送中断信号
    if err := s.process.Interrupt(ctx); err != nil {
        return fmt.Errorf("failed to interrupt process: %w", err)
    }

    // 更新状态
    s.state = protocol.StateStopped
    s.stateStartAt = time.Now()

    // 清理正在处理的消息
    for seq := range s.messageStartTimes {
        delete(s.messageStartTimes, seq)
    }
    s.currentMessageSeq = 0

    // 通知订阅者
    s.notifySubscribers(&protocol.Message{
        Type:      protocol.MessageTypeError,
        Content:   "Operation stopped by user",
        Timestamp: time.Now(),
    })

    logger.Infof("Session %s stopped", s.id)

    return nil
}
```

---

## 五、API 接口设计

### 5.1 获取会话状态

```http
GET /api/v1/sessions/:id/status

Response (200 OK):
{
  "sessionId": "sess_xxx",
  "state": "processing",           // idle, processing, waiting, error, stopped
  "duration": 15000,               // 当前状态持续时长(毫秒)
  "startTime": 1707048380000,      // 当前状态开始时间
  "lastMessageSeq": 124,
  "lastMessageType": "user",
  "lastMessageTime": 1707048390000,
  "totalMessages": 124,
  "processingCount": 1,
  "metadata": {
    "workingDirectory": "/path/to/project",
    "model": "haiku",
    "agent": "claude"
  }
}
```

### 5.2 停止会话

```http
POST /api/v1/sessions/:id/stop

Request (可选):
{
  "reason": "user_cancelled",  // 可选: user_cancelled, timeout, error
  "force": false                // 是否强制终止(使用信号)
}

Response (200 OK):
{
  "success": true,
  "message": "Session stopped",
  "previousState": "processing",
  "stoppedAt": 1707048400000
}

Response (409 Conflict) - 如果当前没有正在处理的消息:
{
  "error": "session_not_processing",
  "message": "Session is not processing (current state: idle)",
  "currentState": "idle"
}
```

### 5.3 消息包含处理时长

```http
GET /api/v1/sessions/:sessionId/messages

Response:
{
  "messages": [
    {
      "seq": 123,
      "type": "user",
      "content": {
        "text": "帮我分析这个项目"
      },
      "timestamp": 1707048380000,
      "processingDuration": 15000,  // 处理时长
      "processingStarted": 1707048380000,
      "processingEnded": 1707048395000,
      "status": "completed"
    },
    {
      "seq": 124,
      "type": "assistant",
      "content": {
        "text": "好的,让我来分析..."
      },
      "timestamp": 1707048395000,
      "processingDuration": 0
    }
  ],
  "hasMore": false,
  "lastSeq": 124
}
```

---

## 六、前端集成示例

### 6.1 状态轮询

```typescript
// 前端: 定期获取会话状态
class AIBridgeClient {
  private statusInterval?: NodeJS.Timeout;

  // 开始监控会话状态
  startStatusMonitoring(sessionId: string, callback: (status: SessionStatus) => void) {
    this.statusInterval = setInterval(async () => {
      const status = await this.getSessionStatus(sessionId);
      callback(status);
    }, 1000); // 每秒更新
  }

  // 停止监控
  stopStatusMonitoring() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = undefined;
    }
  }

  // 获取会话状态
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await fetch(
      `${this.serverUrl}/api/v1/sessions/${sessionId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }
}

// 使用示例
const client = new AIBridgeClient({
  serverUrl: 'http://localhost:8080',
  authToken: 'your-token',
});

const session = await client.createSession({
  workingDirectory: '/my/project',
});

// 开始监控状态
client.startStatusMonitoring(session.id, (status) => {
  console.log(`Session ${status.sessionId}: ${status.state}`);

  // 更新 UI
  if (status.state === 'processing') {
    const seconds = Math.floor(status.duration / 1000);
    updateStatus(`正在思考中... ${seconds}秒`);

    // 超过 30 秒显示警告
    if (status.duration > 30000) {
      showWarning('AI 正在深度思考,请耐心等待...');
    }
  } else if (status.state === 'idle') {
    updateStatus('就绪');
  }
});
```

### 6.2 手动停止

```typescript
// 前端: 停止会话
class AIBridgeClient {
  // 停止会话
  async stopSession(sessionId: string, options?: StopOptions): Promise<StopResult> {
    const response = await fetch(
      `${this.serverUrl}/api/v1/sessions/${sessionId}/stop`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {}),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop session');
    }

    return response.json();
  }
}

// 使用示例: 按钮
async function handleStopClick() {
  try {
    const result = await client.stopSession(session.id, {
      reason: 'user_cancelled',
    });

    console.log('Session stopped:', result);
    showNotification('已停止');
  } catch (error) {
    console.error('Failed to stop:', error);
    showError('停止失败: ' + error.message);
  }
}

// 使用示例: ESC 键
document.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();

    // 检查是否有正在处理的会话
    const status = await client.getSessionStatus(session.id);

    if (status.state === 'processing') {
      // 确认对话框
      const confirmed = confirm('确定要停止当前操作吗?');
      if (confirmed) {
        await client.stopSession(session.id);
      }
    }
  }
});
```

### 6.3 UI 展示建议

```typescript
// React 示例
function SessionStatusIndicator({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 定期获取状态
    const interval = setInterval(async () => {
      try {
        const s = await client.getSessionStatus(sessionId);
        setStatus(s);
      } catch (error) {
        console.error('Failed to get status:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!status) {
    return <div>加载中...</div>;
  }

  // 状态指示器
  const statusColor = {
    idle: 'gray',
    processing: 'blue',
    waiting: 'yellow',
    error: 'red',
    stopped: 'gray',
  }[status.state];

  const duration = Math.floor(status.duration / 1000);

  return (
    <div className="flex items-center gap-2">
      {/* 状态指示灯 */}
      <div className={`w-2 h-2 rounded-full bg-${statusColor}-500`} />

      {/* 状态文本 */}
      <span>
        {status.state === 'processing' && `正在思考中... ${duration}秒`}
        {status.state === 'idle' && '就绪'}
        {status.state === 'waiting' && '等待权限...'}
        {status.state === 'error' && '错误'}
        {status.state === 'stopped' && '已停止'}
      </span>

      {/* 停止按钮 */}
      {(status.state === 'processing' || status.state === 'waiting') && (
        <button
          onClick={() => client.stopSession(sessionId)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          停止 (ESC)
        </button>
      )}
    </div>
  );
}
```

---

## 七、配置调整

### 7.1 移除自动超时配置

```yaml
# configs/config.yaml

# 原配置(移除)
# claude:
#   timeout: 300s  # ❌ 移除自动超时

# 新增: 状态轮询配置(用于前端)
session:
  # 状态更新频率
  statusUpdateInterval: 1s  # 前端建议的轮询间隔

  # 处理时长阈值(仅用于前端显示警告,不强制停止)
  processingDurationWarning: 30s  # 超过此时长前端显示警告
  processingDurationCritical: 60s  # 超过此时长前端显示严重警告

# 健康监控配置(仅监控,不自动重启)
health:
  enabled: true
  checkInterval: 10s
  messageTimeout: 300s  # 仅用于发送警告事件,不自动终止

  # 重启策略(禁用)
  restartOnCrash: false  # ❌ 不自动重启
  restartOnTimeout: false  # ❌ 不自动重启
```

### 7.2 更新健康监控

```go
// internal/health/monitor.go

// handleTimeout 处理超时(仅发送警告)
func (m *HealthMonitor) handleTimeout(processID string, health *ProcessHealth, duration time.Duration) {
    health.UnresponsiveDuration = duration

    // 仅发送警告事件,不强制终止或重启
    if m.config.SendWarning {
        m.eventChan <- HealthEvent{
            Type:      EventTypeWarning,
            ProcessID: processID,
            Status:    StatusWarning,
            Message:   fmt.Sprintf("Process unresponsive for %v (no auto-restart)", duration),
            Timestamp: time.Now(),
        }
    }

    // 更新状态
    health.Status = StatusUnhealthy
    health.WarningCount++
}

// 移除 handleRestart 方法(不自动重启)
```

---

## 八、测试用例

### 8.1 状态跟踪测试

```go
// tests/integration/session_status_test.go

func TestSessionStatus_Tracking(t *testing.T) {
    // Arrange
    server := setupTestServer(t)
    defer server.Close()

    session := createTestSession(t, server.URL)

    // Act - 发送消息
    sendMessage(t, server.URL, session.ID, "test message")

    // 等待处理开始
    time.Sleep(100 * time.Millisecond)

    // 获取状态
    status := getSessionStatus(t, server.URL, session.ID)

    // Assert - 应该是 processing 状态
    assert.Equal(t, "processing", status.State)
    assert.Greater(t, status.Duration, int64(0))
    assert.Equal(t, int64(1), status.ProcessingCount)

    // 等待处理完成
    time.Sleep(5 * time.Second)

    // 再次获取状态
    status = getSessionStatus(t, server.URL, session.ID)

    // Assert - 应该回到 idle 状态
    assert.Equal(t, "idle", status.State)
}

func TestSessionStatus_Duration(t *testing.T) {
    // Arrange
    session := createTestSession(t, server.URL)

    // Act - 发送消息
    sendMessage(t, server.URL, session.ID, "long task")

    // 定期获取状态
    var durations []int64
    for i := 0; i < 10; i++ {
        time.Sleep(500 * time.Millisecond)
        status := getSessionStatus(t, server.URL, session.ID)
        if status.State == "processing" {
            durations = append(durations, status.Duration)
        }
    }

    // Assert - 时长应该递增
    for i := 1; i < len(durations); i++ {
        assert.Greater(t, durations[i], durations[i-1])
    }
}
```

### 8.2 手动停止测试

```go
func TestSession_Stop(t *testing.T) {
    // Arrange
    session := createTestSession(t, server.URL)

    // 发送长时间任务
    sendMessage(t, server.URL, session.ID, "analyze entire project")

    // 等待处理开始
    time.Sleep(500 * time.Millisecond)

    // 验证状态是 processing
    status := getSessionStatus(t, server.URL, session.ID)
    assert.Equal(t, "processing", status.State)

    // Act - 停止会话
    stopSession(t, server.URL, session.ID)

    // Assert - 状态应该是 stopped
    status = getSessionStatus(t, server.URL, session.ID)
    assert.Equal(t, "stopped", status.State)
}

func TestSession_Stop_Idle(t *testing.T) {
    // Arrange
    session := createTestSession(t, server.URL)

    // 确保是空闲状态
    status := getSessionStatus(t, server.URL, session.ID)
    assert.Equal(t, "idle", status.State)

    // Act - 尝试停止
    err := stopSessionWithError(t, server.URL, session.ID)

    // Assert - 应该返回错误
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not processing")
}
```

---

## 九、总结

### 9.1 关键变更

| 功能 | 原设计 | 新设计 |
|------|--------|--------|
| **超时处理** | 自动超时停止 | 仅显示时长,不自动停止 |
| **终止方式** | 无 | 手动终止(ESC 按钮) |
| **状态跟踪** | 无 | 实时状态 API |
| **处理时长** | 无记录 | 每条消息记录时长 |

### 9.2 实现优先级

| 任务 | 工作量 | 优先级 |
|------|-------|--------|
| ✅ 会话状态跟踪 | 1天 | P0 |
| ✅ 手动终止接口 | 1天 | P0 |
| ✅ 前端集成示例 | 0.5天 | P0 |
| ✅ 移除自动超时逻辑 | 0.5天 | P1 |
| ⏳ 测试用例 | 1天 | P1 |

### 9.3 下一步行动

1. ✅ 实现会话状态跟踪
2. ✅ 实现手动终止接口
3. ✅ 更新健康监控(移除自动重启)
4. ⏳ 编写测试用例
5. ⏳ 前端集成

---

**文档版本**: 1.0
**最后更新**: 2026-02-04
