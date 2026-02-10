# AI-Bridge 调试技能主工作流

这是 ai-bridge-debug 技能的主入口点，处理所有调试会话的初始化和协调。

## 第一步：预检查

在开始调试之前，验证基本环境：

### 1.1 验证项目目录
- 确认在 `C:\WorkSpace\ai-bridge` 目录
- 检查关键目录存在：
  - `configs/` - 配置文件
  - `internal/` - Go 源代码
  - `web/` - 前端源代码
  - `logs/` - 日志文件

### 1.2 检查配置文件
```batch
# 检查后端配置
if not exist "configs\config.yaml" (
    echo [WARN] Backend config not found
    echo Copy from configs\config.yaml.example
)
```

## 第二步：服务管理

### 2.1 检查服务状态

运行服务检查脚本：
```batch
.claude\skills\ai-bridge-debug\scripts\check-services.bat
```

根据输出判断：
- 后端是否运行（port 8080）
- 前端是否运行（port 3000）
- 进程 ID 信息

### 2.2 启动必要服务

**如果后端未运行**：
```batch
.claude\skills\ai-bridge-debug\scripts\start-backend.bat
```

**如果前端未运行**：
```batch
cd web
npm run dev
```

### 2.3 验证服务健康

```batch
.claude\skills\ai-bridge-debug\scripts\health-check.bat
```

## 第三步：问题分类

根据用户描述，选择适当的调试工作流：

### 分类决策树

```
用户问题
    |
    v
是否提到 "SDK" 或 "集成测试"？
    YES → workflows/sdk-test.md
    NO  → 继续判断
    |
    v
是否提到 "后端"、"Go"、"日志"、"panic"？
    YES → workflows/backend-debug.md
    NO  → 继续判断
    |
    v
是否提到 "前端"、"浏览器"、"UI"、"页面"？
    YES → workflows/frontend-debug.md
    NO  → 继续判断
    |
    v
是否提到 "API"、"端点"、"404"、"500"？
    YES → workflows/api-debug.md
    NO  → 继续判断
    |
    v
是否提到 "WebSocket"、"连接"、"CORS"、"通信"？
    YES → workflows/integration-debug.md
    NO  → 继续判断
    |
    v
是否提到 "慢"、"超时"、"性能"？
    YES → workflows/performance-debug.md
    NO  → workflows/adaptive-debug.md
```

## 第四步：并行诊断

根据选择的工作流，启动相应的 Agent。

### 4.1 后端问题诊断

启动后端日志分析 Agent：
```
任务：分析 AI-Bridge 后端日志
- 运行 scripts\analyze-logs.bat
- 搜索最近的 ERROR/FATAL 日志
- 提取堆栈跟踪
- 定位源代码位置（file:line）
- 分析错误上下文（前后各 5 行）
```

### 4.2 前端问题诊断

集成 dev-browser 技能：
```
使用 dev-browser 技能：
1. 打开 http://localhost:3000
2. 检查浏览器控制台错误
3. 验证 WebSocket 连接状态
4. 测试网络请求
5. 截图（如需要）
```

### 4.3 集成问题诊断（并行）

启动多个 Agent 同时分析：

**Agent 1：后端日志分析**
- 分析最近的错误日志
- 检查 WebSocket 连接日志
- 验证 CORS 配置

**Agent 2：前端浏览器测试**
- 使用 dev-browser 打开页面
- 测试 WebSocket 连接
- 检查网络请求失败

**Agent 3：配置验证**
- 检查 `configs/config.yaml`
- 验证端口配置
- 检查 CORS 允许源

## 第五步：结果聚合

收集所有 Agent 的输出，进行关联分析：

### 5.1 关联分析

```
后端日志错误 + 前端控制台错误 → 综合诊断

示例：
后端：[ERROR] WebSocket connection refused
前端：[Error] WebSocket connection failed

结论：后端 WebSocket 服务未启动或端口配置错误
```

### 5.2 生成诊断报告

使用标准格式：
```markdown
## 问题描述
[用户提供的问题摘要]

## 服务状态
- 后端: ✅ 运行中 / ❌ 停止
- 前端: ✅ 运行中 / ❌ 停止
- 健康检查: ✅ 通过 / ❌ 失败

## 后端日志分析
- 最近错误: [错误信息]
- 相关日志片段
- 分析结论

## 前端测试结果
- 浏览器状态
- 网络请求结果
- 控制台错误

## 根本原因
[综合分析结论]

## 修复建议
1. 具体修复步骤
2. 代码位置（file:line）
3. 配置更改
4. 验证步骤
```

## 第六步：修复建议与验证

### 6.1 提供修复方案

根据问题类型，提供相应的修复：

**代码问题**：
- 显示需要修改的代码
- 标注文件和行号
- 提供修复后的代码示例

**配置问题**：
- 显示当前配置
- 提供正确的配置
- 说明配置位置

**环境问题**：
- 列出缺少的依赖
- 提供安装命令
- 说明配置步骤

### 6.2 验证步骤

使用 dev-browser 技能验证修复：
```
1. 应用修复
2. 重启服务（如需要）
3. 使用 dev-browser 测试
4. 确认问题解决
5. 检查无新问题引入
```

## 常见场景处理

### 场景 1：SDK 测试

当用户要求测试 SDK 时：
1. 检查服务状态
2. 启动后端（如需要）
3. 验证前端运行
4. 使用 dev-browser 打开 `http://localhost:3000/test-sdk.html`
5. 检查连接状态
6. 测试发送消息功能
7. 生成测试报告

### 场景 2：Git 提交后测试

当用户刚提交代码需要测试时：
1. 检查服务状态
2. 根据修改的文件确定测试范围
3. 运行相应的测试
4. 使用 dev-browser 验证前端
5. 分析日志确保无新错误
6. 生成测试报告

### 场景 3：复杂问题诊断

对于复杂或未知问题：
1. 启动所有诊断 Agent（并行）
2. 收集全面的诊断信息
3. 进行关联分析
4. 提供多角度的修复建议
5. 制定验证计划

## 注意事项

1. **Windows 环境**：所有路径使用反斜杠 `\`
2. **BAT 脚本**：使用提供的脚本，不要手动操作
3. **并行执行**：尽可能并行运行多个 Agent 以提高效率
4. **上下文保持**：在同一个会话中保持诊断上下文
5. **验证修复**：始终使用 dev-browser 验证修复后的功能

## 可用资源

- **服务管理脚本**：`scripts/` 目录
- **调试工作流**：`workflows/` 目录
- **参考文档**：`references/` 目录
- **项目规范**：`CLAUDE.md`
- **主技能文件**：`.claude/skills/ai-bridge-debug.md`
