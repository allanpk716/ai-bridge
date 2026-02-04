# AI-Bridge 快速开始指南

## 前置要求

### 1. 安装Go

从 [https://golang.org/dl/](https://golang.org/dl/) 下载并安装Go 1.21或更高版本。

安装后验证:
```bash
go version
```

### 2. 安装Claude Code CLI

从 [https://claude.ai/download](https://claude.ai/download) 下载并安装Claude Code CLI。

安装后验证:
```bash
claude --version
```

### 3. 认证Claude CLI

```bash
claude auth login
```

## 项目设置

### 1. 克隆或进入项目目录

```bash
cd C:\WorkSpace\ai-bridge
```

### 2. 初始化Go模块和安装依赖

```bash
make init
```

这会执行:
- 初始化Go模块(如果尚未初始化)
- 安装所有必需依赖
- 整理依赖关系

### 3. 创建配置文件

```bash
copy configs\config.yaml.example configs\config.yaml
```

### 4. 编辑配置文件

使用你喜欢的编辑器打开 `configs\config.yaml`,修改以下关键配置:

```yaml
# 服务器配置
server:
  host: "0.0.0.0"
  port: 8080
  publicUrl: "http://localhost:8080"

# 认证配置 - 修改这些!
auth:
  jwtSecret: "your-super-secret-jwt-key-here"
  cliApiToken: "your-api-token-here"

# Claude CLI配置
claude:
  defaultModel: "haiku"  # 或 "sonnet", "opus"
  timeout: 300s
  permissionMode: "normal"
```

## 构建和运行

### 构建项目

```bash
make build
```

编译后的二进制文件位于 `bin\ai-bridge.exe`

### 运行项目

方式1: 使用Makefile
```bash
make run
```

方式2: 直接运行
```bash
bin\ai-bridge.exe server --config configs\config.yaml
```

方式3: 使用go run
```bash
go run cmd\ai-bridge\main.go --config configs\config.yaml
```

## 验证安装

### 1. 检查健康状态

```bash
curl http://localhost:8080/health
```

预期响应:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-04T12:00:00Z",
  "uptime": "1m30s",
  "version": "0.1.0"
}
```

### 2. 创建会话

```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d "{\"workingDir\":\"C:/WorkSpace/test-project\"}"
```

### 3. 发送消息

```bash
# 将SESSION_ID替换为上一步返回的ID
curl -X POST http://localhost:8080/api/v1/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"hello\"}"
```

## 测试

### 运行所有测试

```bash
make test-all
```

### 运行单元测试

```bash
make test-unit
```

### 运行E2E测试(需要Claude CLI)

```bash
make test-e2e
```

### 生成覆盖率报告

```bash
make test-coverage
```

覆盖率报告会生成在 `coverage.html`

## 开发

### 代码格式化

```bash
make fmt
```

### 代码检查

```bash
make lint
```

### 清理构建产物

```bash
make clean
```

## 目录结构

```
ai-bridge/
├── bin/                  # 编译后的二进制文件
├── cmd/ai-bridge/        # 主程序入口
├── configs/              # 配置文件
├── data/                 # 运行时数据(数据库等)
├── docs/                 # 项目文档
├── internal/             # 内部包
│   ├── api/              # HTTP API
│   ├── claude/           # Claude CLI包装器
│   ├── commands/         # 斜杠命令
│   ├── config/           # 配置管理
│   ├── health/           # 健康检查
│   ├── pool/             # 进程池
│   ├── session/          # 会话管理
│   └── websocket/        # WebSocket
├── logs/                 # 日志文件
├── pkg/protocol/         # 协议类型
├── scripts/              # 工具脚本
├── tmp/                  # 临时文件
└── tests/                # 测试套件
```

## 故障排除

### 问题: "go: command not found"

**解决方案**: Go未安装或未在PATH中。请重新安装Go并确保添加到PATH。

### 问题: "config file not found"

**解决方案**: 确保已复制配置文件:
```bash
copy configs\config.yaml.example configs\config.yaml
```

### 问题: "Claude CLI not found"

**解决方案**: 安装Claude Code CLI并确保在PATH中。验证: `claude --version`

### 问题: 端口8080已被占用

**解决方案**: 修改 `configs\config.yaml` 中的端口号。

### 问题: 权限错误

**解决方案**: 确保Claude CLI已认证: `claude auth login`

## 下一步

1. 查看 [README.md](README.md) 了解完整功能
2. 查看 [docs/plans/](docs/plans/) 了解开发计划
3. 查看 [CLAUDE.md](CLAUDE.md) 了解开发规范

## 获取帮助

- 查看日志: `logs\ai-bridge.log`
- 检查健康状态: `curl http://localhost:8080/health`
- 开启调试模式: 在配置文件中设置 `logging.level: debug`
