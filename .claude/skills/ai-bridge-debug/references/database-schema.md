# Database Schema

## AI-Bridge SQLite 数据库结构

本文档描述 AI-Bridge 使用的 SQLite 数据库结构。

## 数据库位置

```
./data/ai-bridge.db
```

（根据 `configs/config.yaml` 中的 `database.path` 配置）

## 表结构

### sessions 表

存储 AI-Bridge session 信息。

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,           -- starting, ready, busy, stopped, error
    model TEXT NOT NULL,            -- haiku, sonnet, opus
    working_dir TEXT NOT NULL,      -- Claude CLI 工作目录
    permission_mode TEXT NOT NULL,  -- normal, auto-deny
    created_at INTEGER NOT NULL,    -- Unix 时间戳
    updated_at INTEGER NOT NULL,    -- Unix 时间戳
    metadata TEXT                   -- JSON 元数据
);
```

**索引：**
```sql
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

**常用查询：**
```sql
-- 获取所有活动 session
SELECT * FROM sessions WHERE status IN ('ready', 'busy');

-- 获取特定 session
SELECT * FROM sessions WHERE id = ?;

-- 清理旧 session（7 天前）
DELETE FROM sessions WHERE created_at < ?;
```

### messages 表

存储所有 session 消息。

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,       -- 外键到 sessions.id
    seq INTEGER NOT NULL,           -- 消息序列号（单调递增）
    role TEXT NOT NULL,             -- user, assistant, system
    content TEXT NOT NULL,           -- 消息内容
    timestamp INTEGER NOT NULL,      -- Unix 时间戳
    metadata TEXT,                  -- JSON 元数据
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**索引：**
```sql
CREATE UNIQUE INDEX idx_messages_session_seq ON messages(session_id, seq);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

**重要设计：**
- `(session_id, seq)` 是唯一索引 - seq 在 session 内单调递增
- seq 用于增量同步（`SELECT * FROM messages WHERE session_id = ? AND seq > ?`）
- 外键级联删除 - 删除 session 时自动删除消息

**常用查询：**
```sql
-- 获取最近消息（用于初始加载）
SELECT * FROM messages
WHERE session_id = ?
ORDER BY seq DESC
LIMIT 50;

-- 增量同步（获取新消息）
SELECT * FROM messages
WHERE session_id = ? AND seq > ?
ORDER BY seq ASC;

-- 历史滚动（获取旧消息）
SELECT * FROM messages
WHERE session_id = ? AND seq < ?
ORDER BY seq DESC
LIMIT 50;

-- 获取最大 seq（用于同步起点）
SELECT MAX(seq) as max_seq FROM messages WHERE session_id = ?;
```

### permissions 表

存储权限请求和批准状态。

```sql
CREATE TABLE permissions (
    id TEXT PRIMARY KEY,            -- 请求 ID
    session_id TEXT NOT NULL,       -- 外键到 sessions.id
    request_type TEXT NOT NULL,     -- tool_use, resource_access, etc.
    tool_name TEXT,                 -- 工具名称（如适用）
    description TEXT NOT NULL,      -- 权限描述
    params TEXT,                    -- JSON 请求参数
    status TEXT NOT NULL,           -- pending, approved, denied
    scope TEXT,                     -- once, session, always
    created_at INTEGER NOT NULL,    -- Unix 时间戳
    resolved_at INTEGER,            -- Unix 时间戳
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**索引：**
```sql
CREATE INDEX idx_permissions_session_status ON permissions(session_id, status);
CREATE INDEX idx_permissions_created_at ON permissions(created_at);
```

**常用查询：**
```sql
-- 获取待处理权限
SELECT * FROM permissions
WHERE session_id = ? AND status = 'pending'
ORDER BY created_at ASC;

-- 批准权限
UPDATE permissions
SET status = 'approved', scope = ?, resolved_at = ?
WHERE id = ? AND status = 'pending';

-- 拒绝权限
UPDATE permissions
SET status = 'denied', resolved_at = ?
WHERE id = ? AND status = 'pending';

-- 清理旧权限（24 小时前）
DELETE FROM permissions WHERE created_at < ?;
```

## 性能优化

### 查询分析

使用 `EXPLAIN QUERY PLAN` 分析慢查询：

```sql
EXPLAIN QUERY PLAN
SELECT * FROM messages
WHERE session_id = ? AND seq > ?
ORDER BY seq ASC;
```

预期结果：
```
SCAN messages USING INDEX idx_messages_session_seq
```

如果看到 `SCAN TABLE`，说明缺少索引。

### 索引检查

列出表的所有索引：

```sql
PRAGMA index_list('messages');
PRAGMA index_info('idx_messages_session_seq');
```

### 数据库维护

```sql
-- 分析表统计信息
ANALYZE;

-- 重建数据库（减少碎片）
VACUUM;

-- 检查数据库完整性
PRAGMA integrity_check;
```

## 常见问题

### 数据库锁定

**症状：** `database is locked` 错误

**原因：**
- 多个进程试图写入
- 未关闭的事务
- 长时间运行的查询

**诊断：**
```sql
-- 检查打开的连接
PRAGMA database_list;

-- 检查锁
PRAGMA lock_status;
```

**解决：**
1. 停止 ai-bridge 服务器
2. 删除 `-wal` 和 `-shm` 文件
3. 重启服务器

### 查询慢

**症状：** API 响应慢

**诊断：**
```sql
-- 检查索引
PRAGMA index_list('messages');

-- 分析查询计划
EXPLAIN QUERY PLAN <your query>;
```

**解决：**
- 添加缺失的索引
- 使用 `LIMIT` 限制结果
- 使用特定列而非 `SELECT *`

### 磁盘空间

**症状：** 数据库文件增长过大

**诊断：**
```sql
-- 检查表大小
SELECT name, COUNT(*) as count FROM messages GROUP BY name;

-- 检查数据库大小
PRAGMA page_count;
PRAGMA page_size;
```

**解决：**
```sql
-- 删除旧 session（7 天前）
DELETE FROM sessions WHERE created_at < ?;

-- 删除旧消息（删除 session 时级联删除）

-- 运行 VACUUM 回收空间
VACUUM;
```

## 连接池配置

Go 代码中配置 SQLite 连接池：

```go
db.SetMaxOpenConns(1)        // SQLite 只允许一个写入连接
db.SetMaxIdleConns(1)
db.SetConnMaxLifetime(5 * time.Minute)
```

## 备份和恢复

### 备份

```bash
# 简单复制（需要停止服务器）
cp data/ai-bridge.db data/backup/ai-bridge-$(date +%Y%m%d).db

# 在线备份（SQLite 命令）
sqlite3 data/ai-bridge.db ".backup data/backup/ai-bridge.db"
```

### 恢复

```bash
# 停止服务器
# 复制备份
cp data/backup/ai-bridge-20250115.db data/ai-bridge.db
# 重启服务器
```

## 数据库迁移

AI-Bridge 使用 Go 代码管理迁移：

```
internal/session/migrations/
├── 001_initial_schema.go
├── 002_add_permissions.go
└── ...
```

迁移在启动时自动应用。
