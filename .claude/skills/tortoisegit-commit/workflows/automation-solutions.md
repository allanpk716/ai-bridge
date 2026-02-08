# TortoiseGit 完全自动化解决方案

## 问题分析

当前问题:
1. `TortoiseGitProc.exe /command:push` 会弹出推送对话框
2. Pageant 需要手动加载 PPK 密钥

## 解决方案

### 方案 1: 使用 TortoiseGitProc 的完整参数(推荐)

使用更详细的参数来避免对话框:

```bash
# 完全自动化的推送命令
TortoiseGitProc.exe /command:push /path:"." /remote:origin /branch:master /closeonend:2 /silent
```

**参数说明:**
- `/remote:origin` - 指定远程仓库
- `/branch:master` - 指定分支名
- `/silent` - 静默模式,不显示对话框
- `/closeonend:2` - 总是自动关闭

### 方案 2: 配置 Git 使用 Plink + Pageant

让 git 命令也能使用 PPK 密钥:

```bash
# 1. 配置 git 使用 plink
git config --global core.sshcommand "plink"

# 2. 配置 plink 自动使用 Pageant
# (plink 默认会自动从 Pageant 获取密钥)

# 3. 之后可以直接使用 git push
git push
```

**前提条件:**
- Pageant 必须运行并已加载 PPK 密钥
- plink.exe 在 PATH 中(TortoiseGit 安装时已包含)

### 方案 3: 使用批处理脚本自动加载 PPK

创建一个脚本自动启动 Pageant 并加载密钥:

```batch
@echo off
REM auto-git-push.bat

REM 1. 检查 Pageant 是否运行
tasklist /FI "IMAGENAME eq pageant.exe" 2>NUL | find /I /N "pageant.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Pageant is running
) else (
    echo Starting Pageant...
    start "Pageant" "C:\Program Files\PuTTY\pageant.exe" "C:\path\to\your\key.ppk"
)

REM 2. 等待 Pageant 启动
timeout /t 2 /nobreak >nul

REM 3. 执行 Git 操作
git add -A
git commit -m "%1"
git push
```

**使用方式:**
```bash
auto-git-push.bat "feat: my commit message"
```

### 方案 4: TortoiseGitProc + 预配置脚本

在技能中先配置环境,再执行推送:

```bash
# 1. 确保 Pageant 运行并加载密钥
tasklist | find /I "pageant.exe" || start pageant "C:\path\to\key.ppk"

# 2. 使用 TortoiseGitProc 推送(带完整参数)
TortoiseGitProc.exe /command:push /path:"." /remote:origin /branch:master /closeonend:2 /silent
```

## 推荐方案组合

**最佳实践 - 方案 2 + 方案 3:**

1. **一次性配置:**
   ```bash
   git config --global core.sshcommand "plink"
   ```

2. **创建启动脚本** (start-dev.bat):
   ```batch
   @echo off
   REM 启动 Pageant 并自动加载 PPK
   "C:\Program Files\PuTTY\pageant.exe" "C:\Users\allan716\.ssh\your_key.ppk"

   REM 保持运行(不关闭窗口)
   echo Pageant started with PPK key loaded
   pause
   ```

3. **Windows 开机启动:**
   - 将 start-dev.bat 的快捷方式放到:
   - `C:\Users\allan716\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

4. **之后的 Git 操作:**
   ```bash
   # 直接使用 git 命令(会自动使用 plink + Pageant)
   git push
   ```

## TortoiseGitProc 完整命令参考

```bash
# 推送(完全静默)
TortoiseGitProc.exe /command:push /path:"." /remote:origin /branch:master /closeonend:2 /silent

# 拉取(完全静默)
TortoiseGitProc.exe /command:pull /path:"." /closeonend:2 /silent

# 提交(完全静默)
TortoiseGitProc.exe /command:commit /path:"." /logmsg:"message" /closeonend:2

# 同步(拉取+推送)
TortoiseGitProc.exe /command:sync /path:"." /closeonend:2 /silent
```

## 关键参数说明

| 参数 | 说明 |
|------|------|
| `/silent` | 静默模式,不显示任何对话框 |
| `/closeonend:0` | 不自动关闭 |
| `/closeonend:1` | 成功时关闭,错误时保持 |
| `/closeonend:2` | 总是自动关闭(推荐) |
| `/remote:name` | 指定远程仓库名称 |
| `/branch:name` | 指定分支名称 |
| `/url:url` | 指定仓库 URL |
| `/path:path` | 工作目录路径 |

## 技能集成建议

更新技能的推送部分为:

```bash
# 1. 确保 Pageant 运行(技能中添加检查)
tasklist | find /I "pageant.exe" || (
    echo Error: Pageant not running. Please start Pageant with your PPK key.
    exit 1
)

# 2. 使用完整的静默推送参数
TortoiseGitProc.exe /command:push /path:"." /remote:origin /branch:master /closeonend:2 /silent
```

这样就能实现完全自动化,无需手动操作!
