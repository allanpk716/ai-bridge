# AI-Bridge Debug Skill Setup Guide

## Prerequisites

### Backend Requirements
- Go 1.x installed
- AI-Bridge service running on `http://localhost:8080`
- Log directory: `./logs/` relative to project root
- Logger library: `github.com/WQGroup/logger`

### Frontend Requirements
- Node.js 18+ installed
- Frontend dev server running on `http://localhost:3000`
- React 19 + Vite
- Socket.IO Client 4.8.3

### Claude Code Skills Dependencies
- `dev-browser` skill must be installed (for browser automation)
- Verify: `/help dev-browser` in Claude Code

## Installation

### 1. Verify Dependencies

Check dev-browser skill:
```bash
# In Claude Code, run:
/help dev-browser
```

If not found, install from Claude Code skills marketplace.

### 2. Configure Frontend Dev Server

Ensure Vite dev server is configured:
```bash
cd web
npm run dev
# Should start on http://localhost:3000
```

### 3. Start Backend Service

```bash
# From project root
go run cmd/ai-bridge/main.go --config configs/config.yaml
# Should start on http://localhost:8080
```

### 4. Verify Log Directory

```bash
ls logs/
# Should see: ai-bridge-YYYY-MM-DD.log files
```

## Configuration

### Environment Variables

Optional environment variables:

```bash
# Backend port (default: 8080)
export AI_BRIDGE_BACKEND_PORT=8080

# Frontend port (default: 3000)
export AI_BRIDGE_FRONTEND_PORT=3000

# Log directory (default: ./logs/)
export AI_BRIDGE_LOG_DIR=./logs/
```

### Frontend URL Configuration

If your frontend runs on a different port:
Update the skill to use: `http://localhost:YOUR_PORT`

## Usage Examples

### Debug WebSocket Connection
```
/ai-bridge-debug 前端无法连接到后端 WebSocket
```

### Debug API Error
```
/ai-bridge-debug 创建会话接口返回 500 错误
```

### Debug Frontend Display
```
/ai-bridge-debug 会话列表页面不显示数据
```

## Troubleshooting

### dev-browser skill not found
**Solution**: Install dev-browser skill from Claude Code marketplace

### Backend logs not found
**Solution**: Ensure backend service is running and log directory exists

### Frontend dev server not accessible
**Solution**: Check if `npm run dev` is running in web/ directory

### Permission denied accessing logs
**Solution**: Check file permissions for `./logs/` directory

## Verification

Test the skill:
```
/ai-bridge-debug 测试技能是否正常工作
```

Expected output:
- Backend log analysis
- Frontend browser test
- Comprehensive diagnostic report
