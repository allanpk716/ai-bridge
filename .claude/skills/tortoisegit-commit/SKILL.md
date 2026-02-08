---
name: tortoisegit-commit
description: Windows Git commit and push using TortoiseGit with PPK authentication. Automatically analyzes changes, generates commit messages, and executes operations in a subagent to preserve context.
---

<objective>
Automate Git commit and push operations on Windows using TortoiseGit command-line tools. This skill analyzes code changes, generates descriptive commit messages, and executes all Git operations in a subagent context to preserve the main conversation's context window. It solves SSH key authentication problems by leveraging TortoiseGit's PPK key configuration.
</objective>

<quick_start>
**Automatic commit and push (recommended):**

Invoke this skill with:
```
Use tortoisegit-commit to commit and push my changes
```

The skill will:
1. Analyze your recent changes using git diff
2. Generate a descriptive commit message based on the changes
3. Stage all modified files
4. Commit using TortoiseGitProc.exe
5. Push to remote repository
6. Return only the summary result

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
- Git is using a different SSH client than TortoiseGit
- Pageant (PuTTY authentication agent) holds the PPK key but git can't access it

This skill solves these problems by:
- Using TortoiseGitProc.exe with PuTTY's plink as SSH client
- Reading PPK keys from PuTTY's configuration
- Integrating with Pageant for authentication
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
2. **Analyze Changes**: Run git status and git diff to understand what changed
3. **Generate Message**: Create a commit message based on the changes
4. **Stage Files**: Run git add to stage all modified files
5. **Commit**: Use TortoiseGitProc.exe to create the commit
6. **Push**: Use TortoiseGitProc.exe to push to remote
7. **Report**: Return a concise summary of what was done

**Why subagent?**
- Keeps main conversation context small
- Git command output doesn't clutter the conversation
- Long-running operations don't block the conversation
- Errors are handled and summarized cleanly

**Environment Detection:**
The skill automatically detects:
- User home directory: `%USERPROFILE%` or `~`
- TortoiseGit installation: checks `C:\Program Files\TortoiseGit\bin\` and `%ProgramFiles%\TortoiseGit\bin\`
- PuTTY installation: checks `C:\Program Files\PuTTY\` and `%ProgramFiles%\PuTTY\`

**If not found in PATH**, skill will use common installation paths automatically.
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
Execute the following Git workflow CRITICALLY IMPORTANT - Use TortoiseGitProc for ALL operations requiring authentication:

**Environment Setup for Subagent:**

1. Detect user home directory:
   ```bash
   echo %USERPROFILE%
   ```

2. Detect TortoiseGit installation:
   ```bash
   where TortoiseGitProc.exe
   # or use full path if not in PATH:
   "%ProgramFiles%\TortoiseGit\bin\TortoiseGitProc.exe"
   ```

3. Use detected paths in commands instead of hardcoded ones.

**Git Workflow:**

0. Check if Pageant is running: `tasklist | find /I "pageant.exe"`
   - If not running, warn user but continue (TortoiseGitProc may prompt for key)

1. Check current repository status with `git status`
2. Get current branch name: `git branch --show-current` (store in variable)
3. Show brief diff with `git diff --stat`
4. Generate a descriptive commit message based on changes
5. Stage all changes: `git add -A`
6. Commit using TortoiseGitProc: `TortoiseGitProc.exe /command:commit /path:"." /logmsg:"[generated message]" /closeonend:2`
7. CRITICAL: Push using ONLY TortoiseGitProc with FULL parameters for automation:
   `TortoiseGitProc.exe /command:push /path:"." /remote:origin /branch:[CURRENT_BRANCH] /closeonend:2 /silent`
   - Replace [CURRENT_BRANCH] with actual branch name from step 2
   - The `/silent` flag prevents ALL dialogs from appearing
   - `/remote:origin` prevents remote repository selection dialog
   - `/branch:[NAME]` prevents branch selection dialog
8. Wait 3 seconds for TortoiseGitProc to complete
8. Verify with `git log -1 --oneline` and `git status`

IMPORTANT NOTES:
- NEVER use `git push` command - it will fail with SSH key errors unless configured
- ALWAYS use `TortoiseGitProc.exe /command:push` with FULL parameters for pushing
- TortoiseGitProc uses PPK keys from Pageant which is why this skill exists
- CRITICAL PARAMETERS for automation:
  * `/silent` - Suppresses ALL dialog boxes (required for automation)
  * `/remote:origin` - Prevents remote repository selection dialog
  * `/branch:NAME` - Prevents branch selection dialog (use current branch)
  * `/closeonend:2` - Auto-closes TortoiseGitProc window
- If TortoiseGitProc is not in PATH, use full path: "%ProgramFiles%\TortoiseGit\bin\TortoiseGitProc.exe"

ALTERNATIVE: One-time setup to enable `git push` with PPK keys:
```bash
git config --global core.sshcommand "plink"
```
After this, standard `git push` will also work with PPK keys (if Pageant is running).
But this skill still prefers TortoiseGitProc for consistency.

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
**TortoiseGitProc.exe command reference:**

**Commit:**
```bash
TortoiseGitProc.exe /command:commit /path:"." /logmsg:"Message" /closeonend:1
```

**Commit and push together:**
```bash
TortoiseGitProc.exe /command:commit /path:"." /logmsg:"Message" /push /closeonend:1
```

**Push only:**
```bash
TortoiseGitProc.exe /command:push /path:"." /closeonend:2
```

**Parameters:**
- `/command:commit` - Execute commit operation
- `/command:push` - Execute push operation
- `/path:"."` - Repository directory ("." for current directory)
- `/logmsg:"message"` - Commit message (must be quoted)
- `/push` - Push after commit (optional)
- `/closeonend:1` - Auto-close if successful, stay open on errors
- `/closeonend:2` - Always auto-close

**Exit codes (/closeonend):**
- 0 = Don't close (for debugging)
- 1 = Auto-close if successful, keep open if errors (recommended)
- 2 = Always auto-close (force)
- 3 = Auto-close if no errors, conflicts, or merges
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

**Error: "TortoiseGitProc.exe not found"**
Solution:
- Ensure TortoiseGit is installed
- Add to PATH: `C:\Program Files\TortoiseGit\bin`
- Or use full path in commands

**Error: "Permission denied (publickey)"**
Solution:
- Ensure Pageant is running with PPK key loaded
- Verify TortoiseGit SSH settings point to plink
- Check remote URL: `git remote -v`

**Error: "Nothing to commit"**
Solution:
- Check if files are staged: `git status`
- Stage files: `git add -A`
- Verify there are actual changes

**Error: "Push rejected"**
Solution:
- Pull first: `git pull --rebase`
- Resolve conflicts if any
- Try push again

**Error: "Failed to push some refs"**
Solution:
- Check network connection
- Verify remote repository exists
- Ensure you have push permissions
- Check if branch is protected
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
- Commit message generated or used correctly
- Files staged successfully
- TortoiseGitProc commit exits with code 0
- TortoiseGitProc push exits with code 0
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
