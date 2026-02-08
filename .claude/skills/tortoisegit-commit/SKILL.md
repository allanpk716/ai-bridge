---
name: tortoisegit-commit
description: Windows Git commit and push using command-line git with plink + PPK authentication. Automatically analyzes changes, generates commit messages, and executes operations in a subagent to preserve context. No GUI dialogs.
---

<objective>
Automate Git commit and push operations on Windows using command-line git with plink SSH client. This skill analyzes code changes, generates descriptive commit messages, and executes all Git operations in a subagent context to preserve the main conversation's context window. It solves SSH key authentication problems by configuring git to use plink and reading PPK keys from Pageant. All operations are performed via command-line git without any GUI dialogs.
</objective>

<quick_start>
**Automatic commit and push (recommended):**

Invoke this skill with:
```
Use tortoisegit-commit to commit and push my changes
```

The skill will:
1. Ensure git is configured to use plink for SSH authentication
2. Analyze your recent changes using git diff
3. Generate a descriptive commit message based on the changes
4. Stage all modified files
5. Commit using command-line git
6. Push to remote repository using command-line git (no GUI)
7. Return only the summary result

**前提条件:**
- Pageant 必须正在运行并加载了 PPK 密钥
- 第一次运行时会自动配置 git 使用 plink

**With custom commit message:**

```
Use tortoisegit-commit to commit with message "feat: add user authentication"
```

**Commit specific files only:**

```
Use tortoisegit-commit to commit changes in src/ and tests/
```
</quick_start>

<context>
**Why use this skill instead of manual git commands?**

On Windows, standard git commands may fail with "permission denied (publickey)" errors when:
- SSH keys are not configured in standard ~/.ssh/ location
- Git is using OpenSSH instead of PuTTY's plink
- Pageant (PuTTY authentication agent) holds the PPK key but git can't access it

This skill solves these problems by:
- Configuring git to use plink as SSH client (`git config --global core.sshcommand "plink"`)
- Reading PPK keys from Pageant
- Using command-line git instead of TortoiseGitProc GUI (faster, no dialogs)
- Running in a subagent to preserve main conversation context

**Subagent Benefits:**
- Main conversation context stays clean and focused
- Long git operations don't consume your context window
- Git output is processed and summarized
- Errors are caught and reported clearly
</context>

<workflow>
## How This Skill Works

This skill uses the Task tool to launch a Bash agent that executes all Git operations. The workflow is:

1. **Launch Subagent**: Start a bash agent with run_in_background=true
2. **Configure SSH**: Set `git config --global core.sshcommand "plink"` (one-time)
3. **Analyze Changes**: Run git status and git diff to understand what changed
4. **Generate Message**: Create a commit message based on the changes
5. **Stage Files**: Run git add to stage all modified files
6. **Commit**: Use `git commit` command (command-line, no GUI)
7. **Push**: Use `git push` command (uses plink + PPK from Pageant, no GUI)
8. **Report**: Return a concise summary of what was done

**Why subagent?**
- Keeps main conversation context small
- Git command output doesn't clutter the conversation
- Long-running operations don't block the conversation
- Errors are handled and summarized cleanly

**Why command-line git instead of TortoiseGitProc?**
- **Faster**: No GUI overhead
- **No dialogs**: Completely silent operation
- **Better control**: Full access to git options
- **Same authentication**: Uses plink + PPK just like TortoiseGitProc

**Environment Detection:**
The skill automatically checks:
- User home directory: `%USERPROFILE%` or `~`
- Pageant status: Checks if pageant.exe is running
- Git configuration: Ensures `core.sshcommand` is set to "plink"
</workflow>

<one_time_setup>
**推荐的一键配置(完全自动化):**

为了实现完全无人工干预的 Git 操作,建议执行以下一次性配置:

**步骤 1: 配置 git 使用 plink**
```bash
git config --global core.sshcommand "plink"
```
这会让所有 git 命令(包括 git push)自动使用 PuTTY 的 plink,从而可以使用 PPK 密钥。

**步骤 2: 配置 Pageant 开机自动启动并加载 PPK**

创建一个批处理文件 `start-pageant.bat`:
```batch
@echo off
start "Pageant" "C:\Program Files\PuTTY\pageant.exe" "%USERPROFILE%\.ssh\your_key.ppk"
```

将此批处理文件的快捷方式放到启动文件夹:
`%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

**步骤 3: 验证配置**
```bash
# 检查 git 配置
git config --global core.sshcommand
# 应该显示: plink

# 检查 Pageant 是否运行
tasklist | find /I "pageant.exe"
# 应该显示 pageant.exe 进程
```

**完成!**
现在所有 Git 操作都会:
- 自动使用 PPK 密钥认证(无需手动输入密码)
- 不会弹出任何对话框
- 完全在后台运行

这个技能仍会使用 TortoiseGitProc 来保持一致性,但现在它将以完全静默模式运行。
</one_time_setup>

<agent_configuration>
**Launch the agent with these parameters:**

```xml
<subagent_type>Bash</subagent_type>
<description>Execute Git commit and push operations</description>
<prompt>
Execute the following Git workflow using command-line git with PPK authentication:

**Environment Setup for Subagent:**

1. Detect user home directory:
   ```bash
   echo %USERPROFILE%
   ```

2. Check if Pageant is running: `tasklist | find /I "pageant.exe"`
   - If not running, warn user: "⚠ Pageant 未运行，推送可能失败。请先启动 Pageant 并加载 PPK 密钥。"

3. Ensure git is configured to use plink for SSH:
   ```bash
   git config --global core.sshcommand "plink"
   ```
   - This enables git commands to use PPK keys from Pageant
   - Only needs to be done once (first time)

**Git Workflow:**

1. Check current repository status with `git status`
2. Get current branch name: `git branch --show-current` (store in variable)
3. Show brief diff with `git diff --stat`
4. Generate a descriptive commit message based on changes
5. Stage all changes: `git add -A`
6. Commit using command-line git: `git commit -m "[generated message]"`
7. Push using command-line git: `git push`
   - This will use plink (configured in step 3) which reads PPK keys from Pageant
   - No GUI will appear
8. Verify with `git log -1 --oneline` and `git status`

IMPORTANT NOTES:
- ALWAYS use command-line `git commit` and `git push` instead of TortoiseGitProc
- The `core.sshcommand "plink"` configuration enables git to use PPK keys
- Pageant must be running with the PPK key loaded for authentication
- Command-line git is faster and doesn't show any GUI
- TortoiseGitProc is only used as fallback if command-line git is not available

Return ONLY a concise summary in this format:
✓ 操作结果 (成功/失败)
📝 提交信息: [实际使用的提交信息]
📁 文件变更: [简短描述]
🔗 推送状态: [成功/失败]

DO NOT return full git output. Just summarize the results in Chinese.
</prompt>
<run_in_background>true</run_in_background>
</agent_configuration>
```

**Access results using TaskOutput tool.**
</agent_configuration>

<instructions>
When this skill is invoked:

1. **Check if user provided commit message** - If yes, use it. If no, generate one based on changes.

2. **Launch the subagent** using Task tool with:
   - subagent_type: "Bash"
   - description: "Execute Git commit and push operations"
   - prompt: The full workflow instructions
   - run_in_background: true

3. **Get the task_id** from the Task result

4. **Wait for completion** using TaskOutput with:
   - task_id: from step 3
   - block: true
   - timeout: 120000 (2 minutes)

5. **Return summary** to user with what was done

**Error handling:**
- If TaskOutput returns error, summarize the error for user
- If timeout, inform user operation may still be running
- If git operations fail, show error and suggest fixes
</instructions>

<commit_message_generation>
**Auto-generating commit messages:**

When no commit message is provided, analyze the changes to generate one:

```bash
# Get file changes
git diff --cached --name-status
git diff --stat

# Analyze patterns:
- Added new feature files → "feat: add [feature name]"
- Fixed bugs in files → "fix: resolve [issue description]"
- Updated documentation → "docs: update [doc name]"
- Changed configuration → "chore: update [config name]"
- Refactored code → "refactor: [description of refactoring]"
```

**Commit message format:**
```
<type>: <brief description>

<detailed explanation if needed>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
- `feat: add user authentication with JWT tokens`
- `fix: resolve null pointer exception in session manager`
- `docs: update API documentation with new endpoints`
- `refactor: extract session validation to separate module`
</commit_message_generation>

<tortoisegit_commands>
**Command reference for Git operations:**

**推荐: 命令行 git (无 GUI，使用 plink + PPK)**

Commit:
```bash
git commit -m "Your commit message"
```

Push:
```bash
git push
# 推送到特定分支
git push origin feature-branch
```

一次性配置 (使用 PPK 密钥):
```bash
git config --global core.sshcommand "plink"
```

**备选: TortoiseGitProc.exe (图形界面，不推荐用于自动化)**

Commit:
```bash
TortoiseGitProc.exe /command:commit /path:"." /logmsg:"Message" /closeonend:2
```

Push:
```bash
TortoiseGitProc.exe /command:push /path:"." /closeonend:2
```

**Parameters (TortoiseGitProc):**
- `/command:commit` - Execute commit operation
- `/command:push` - Execute push operation
- `/path:"."` - Repository directory ("." for current directory)
- `/logmsg:"message"` - Commit message (must be quoted)
- `/closeonend:2` - Always auto-close (recommended for automation)
- `/silent` - Suppress all dialogs (may not always work)

**为什么优先使用命令行 git?**
- 速度更快 (无 GUI 开销)
- 完全静默 (不会弹出任何窗口)
- 更可靠 (不依赖图形界面)
- 相同的认证方式 (plink + PPK)
</tortoisegit_commands>

<usage_patterns>
**Pattern 1: Quick automatic commit**

```
Use tortoisegit-commit
```

Automatically stages, commits, and pushes all changes with an auto-generated message.

**Pattern 2: With custom message**

```
Use tortoisegit-commit with message "feat: implement user login"
```

Uses your specified message instead of auto-generating.

**Pattern 3: Commit without pushing**

```
Use tortoisegit-commit to commit locally only
```

Skips the push step.

**Pattern 4: Push existing commits**

```
Use tortoisegit-commit to push existing commits
```

Only pushes, doesn't create new commit.

**Pattern 5: Specific files**

```
Use tortoisegit-commit for changes in web/src/
```

Only stages and commits files matching the pattern.
</usage_patterns>

<error_handling>
**Common errors and solutions:**

**Error: "Permission denied (publickey)"**
Solution:
- 确保 Pageant 正在运行: `tasklist | find /I "pageant.exe"`
- 确保 PPK 密钥已加载到 Pageant
- 验证 git 配置: `git config --global core.sshcommand` 应该显示 "plink"
- 检查远程 URL: `git remote -v`

**Error: "Nothing to commit"**
Solution:
- 检查是否有暂存的文件: `git status`
- 暂存文件: `git add -A`
- 确认确实有更改

**Error: "Push rejected"**
Solution:
- 先拉取: `git pull --rebase`
- 解决冲突 (如果有)
- 再次尝试推送

**Error: "Failed to push some refs"**
Solution:
- 检查网络连接
- 验证远程仓库是否存在
- 确保有推送权限
- 检查分支是否受保护

**Error: "plink not found"**
Solution:
- 安装 PuTTY (包含 plink)
- 确保 PuTTY 安装目录在 PATH 中
- 或使用完整路径配置: `git config --global core.sshcommand "C:\Program Files\PuTTY\plink.exe"`

**Error: Pageant 未运行**
Solution:
- 启动 Pageant: 双击 Pageant.exe 或使用启动脚本
- 加载 PPK 密钥: `pageant.exe "path\to\key.ppk"`
- 验证 Pageant 运行: `tasklist | find /I "pageant.exe"`
</error_handling>

<security_checklist>
**Before committing, verify:**
- [ ] No API keys, passwords, or secrets in changes
- [ ] No PPK files or private keys
- [ ] Sensitive files in .gitignore
- [ ] Environment variables used for secrets
- [ ] Commit message doesn't contain sensitive info
- [ ] Review git diff for accidental staging of sensitive files
</security_checklist>

<success_criteria>
Operation is successful when:
- Subagent returns without errors
- `core.sshcommand` is set to "plink" (one-time configuration)
- Pageant is running with PPK key loaded
- Commit message generated or used correctly
- Files staged successfully
- git commit exits with code 0
- git push exits with code 0
- git log shows new commit
- git status shows branch is up-to-date
- Summary returned to user confirms success
</success_criteria>

<implementation_notes>
**For Claude (the AI executing this skill):**

When you receive a request to use this skill:

1. Parse the user's intent:
   - Do they want to push? (default: yes)
   - Did they provide a commit message? (if not, generate one)
   - Are there specific files/patterns? (if not, use "git add -A")

2. Construct the prompt for the Bash subagent with:
   - Clear step-by-step instructions
   - The commit message (or instruction to generate one)
   - Whether to push or skip push
   - Request for concise summary output

3. Launch Task tool with run_in_background=true

4. Use TaskOutput to get results

5. Present user with a clean summary like:
   ```
   ✓ Committed and pushed successfully
   📝 Commit: feat: add user authentication
   📁 Files: 3 changed, 120 insertions(+), 15 deletions(-)
   ```

**Important:** Do NOT return full git command output to the user. Only return a concise summary.
</implementation_notes>
