# Windows Git Commit Skill - 问题总结和解决方案

## 实际使用中遇到的问题

### 问题 1: plink.exe 不在系统 PATH 中

**现象**:
```
error: cannot spawn plink: No such file or directory
fatal: unable to fork
```

**根本原因**:
- 配置 `git config --global core.sshcommand "plink"` 后，git 找不到 plink.exe
- 很多 Windows 系统只安装了 TortoiseGit，没有单独安装 PuTTY
- PuTTY 的 plink.exe 不在系统 PATH 中

**解决方案**:
使用 TortoiseGit 自带的 TortoisePlink.exe：
```bash
git config --global core.sshcommand "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"
```

**注意**:
- TortoiseGit 通常自带 TortoisePlink.exe
- 路径必须是完整的 Windows 路径格式
- 如果 TortoiseGit 安装在其他位置，需要相应调整路径

---

### 问题 2: 路径格式不兼容

**现象**:
```
C:/Program Files/TortoiseGit/bin/TortoisePlink.exe: line 1: C:/Program: No such file or directory
```

**根本原因**:
- Git Bash 风格的路径 (`/c/Program Files/`) 不能被 Windows 程序识别
- 正斜杠路径 (`C:/Program Files/`) 会被 shell 误解
- 路径包含空格，需要引号包裹

**解决方案**:
使用正确的 Windows 路径格式并转义引号：
```bash
# 错误的格式
git config --global core.sshcommand "C:/Program Files/TortoiseGit/bin/TortoisePlink.exe"

# 正确的格式（双反斜杠转义）
git config --global core.sshcommand "\"C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe\""

# 或者使用单引号（在某些 shell 中）
git config --global core.sshcommand '"C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"'
```

---

### 问题 3: Pageant 检测命令不兼容

**现象**:
```
find: '/I': No such file or directory
find: 'pageant.exe': No such file or directory
```

**根本原因**:
- Git Bash 环境不支持 Windows CMD 的 `find /I` 语法
- Windows CMD 的 `tasklist | find /I "pageant.exe"` 在 Bash 中会失败

**解决方案**:
使用跨平台的 grep 命令：
```bash
# 错误（Windows CMD 语法）
tasklist | find /I "pageant.exe"

# 正确（Git Bash 兼容）
tasklist | grep -i pageant
```

---

### 问题 4: TortoiseGitProc 仍然显示 GUI

**现象**:
即使使用了 `/silent` 参数，TortoiseGitProc 有时仍会显示推送对话框

**根本原因**:
- TortoiseGitProc 的 `/silent` 参数不是 100% 可靠
- 某些情况下（如首次推送、认证失败）仍会弹出窗口
- TortoiseGitProc 设计初衷就是 GUI 工具

**解决方案**:
完全放弃使用 TortoiseGitProc，改用命令行 git：
```bash
# 不推荐（可能显示 GUI）
TortoiseGitProc.exe /command:push /path:"." /silent

# 推荐（完全无 GUI）
git push
```

---

## 正确的配置流程

### 步骤 1: 验证环境

```bash
# 检查 Pageant 是否运行
tasklist | grep -i pageant

# 检查 TortoiseGit 安装
ls "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"

# 如果路径不同，找到实际路径
where TortoisePlink.exe 2>/dev/null
```

### 步骤 2: 配置 Git SSH 客户端

```bash
# 查找 TortoisePlink.exe 的完整路径
# 常见位置：
# - C:\Program Files\TortoiseGit\bin\TortoisePlink.exe
# - C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe

# 配置 git 使用 TortoisePlink
git config --global core.sshcommand "\"C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe\""

# 验证配置
git config --global core.sshcommand
# 应该显示: "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"
```

### 步骤 3: 确保 Pageant 运行并加载 PPK 密钥

```bash
# 检查 Pageant 是否运行
tasklist | grep -i pageant

# 如果没有运行，启动 Pageant 并加载密钥
"C:\Program Files\PuTTY\pageant.exe" "path\to\your\key.ppk"

# 或者使用 TortoiseGit 的 Pageant
"C:\Program Files\TortoiseGit\bin\pageant.exe" "path\to\your\key.ppk"
```

### 步骤 4: 测试连接

```bash
# 测试 SSH 连接
ssh -T git@github.com
# 或者
git ls-remote git@github.com:username/repo.git
```

---

## 技能改进要点

1. **自动检测 TortoisePlink 路径**
   - 不硬编码路径
   - 检查多个可能的安装位置
   - 使用 `where` 命令或遍历常见目录

2. **使用跨平台命令**
   - 用 `grep -i` 替代 `find /I`
   - 用 `ls` 替代 `dir`

3. **正确的路径格式**
   - Windows 路径使用反斜杠
   - 包含空格的路径必须用引号包裹
   - 在 git config 中需要双重转义

4. **优先使用命令行 git**
   - 不使用 TortoiseGitProc
   - 直接使用 `git commit` 和 `git push`
   - 更快、更可靠、完全无 GUI

---

## 常见安装路径

### TortoiseGit
```
C:\Program Files\TortoiseGit\bin\TortoisePlink.exe
C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe
```

### PuTTY (如果单独安装)
```
C:\Program Files\PuTTY\plink.exe
C:\Program Files (x86)\PuTTY\plink.exe
C:\Users\<username>\AppData\Local\Programs\PuTTY\plink.exe
```

---

## 故障排查清单

- [ ] Pageant 是否正在运行？
- [ ] PPK 密钥是否已加载到 Pageant？
- [ ] `core.sshcommand` 是否正确配置？
- [ ] SSH 客户端路径是否存在？
- [ ] 路径格式是否正确（Windows 格式 + 引号）？
- [ ] Git 版本是否支持 `core.sshcommand`？（Git 2.19+）
- [ ] 远程仓库 URL 格式是否正确？（应使用 SSH 格式）
