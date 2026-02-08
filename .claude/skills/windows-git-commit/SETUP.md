# Windows Git 自动化配置指南

## 目标
实现完全自动化的 Git 提交和推送,无需任何手动操作或对话框确认。

---

## 🚀 快速配置(5 分钟)

### 步骤 1: 配置 Git 使用 Plink

打开命令行,执行:
```bash
git config --global core.sshcommand "plink"
```

**作用:** 让所有 git 命令自动使用 PuTTY 的 plink,从而可以使用 PPK 密钥。

---

### 步骤 2: 创建 Pageant 自动启动脚本

1. **创建批处理文件** `%USERPROFILE%\start-pageant.bat`:

```batch
@echo off
echo Starting Pageant with PPK key...

REM 替换为你的 PPK 密钥路径
"C:\Program Files\PuTTY\pageant.exe" "%USERPROFILE%\.ssh\your_key.ppk"

echo Pageant started successfully!
timeout /t 3 >nul
```

2. **编辑 PPK 路径**:
   - 将 `"%USERPROFILE%\.ssh\your_key.ppk"` 替换为你的实际 PPK 文件路径
   - 如果不确定路径,在 TortoiseGit 中: Settings → Git → Remote → 查看配置的密钥

---

### 步骤 3: 配置开机自动启动

**方法 A - 使用快捷方式(推荐):**

1. 右键点击 `start-pageant.bat` → 创建快捷方式
2. 复制快捷方式到:
   ```
   %USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
   ```
3. 重启电脑验证 Pageant 自动启动

**方法 B - 使用任务计划程序:**

1. Win+R 输入 `taskschd.msc` 打开任务计划程序
2. 创建基本任务 → 名称: "Start Pageant"
3. 触发器: 当用户登录时
4. 操作: 启动程序 → 浏览选择 `start-pageant.bat`
5. 完成并测试

---

### 步骤 4: 验证配置

**检查项 1: Git 配置**
```bash
git config --global core.sshcommand
```
应该输出: `plink`

**检查项 2: Pageant 运行状态**
```bash
tasklist | find /I "pageant.exe"
```
应该输出: `pageant.exe    xxxx  Console    1    xx,xxx K`

**检查项 3: 测试 Git Push**
```bash
# 创建一个测试提交
git commit --allow-empty -m "test: verify SSH configuration"

# 测试推送(应该不需要密码)
git push
```

如果成功(没有弹出密码对话框),配置完成! ✅

---

## 🔧 故障排除

### 问题 1: git push 仍然提示输入密码

**原因:** Pageant 没有运行或没有加载正确的 PPK 密钥

**解决方案:**
```bash
# 1. 确认 Pageant 运行
tasklist | find /I "pageant.exe"

# 2. 手动启动 Pageant 并加载密钥
"C:\Program Files\PuTTY\pageant.exe" "C:\path\to\your\key.ppk"

# 3. 重试 git push
```

### 问题 2: TortoiseGit 仍然弹出对话框

**原因:** TortoiseGitProc 命令缺少 `/silent` 参数

**解决方案:**
- 使用 `/windows-git-commit` 技能的最新版本
- 技能已更新使用 `/silent` 参数

### 问题 3: 找不到 PPK 密钥文件

**查找方法:**
1. 打开 TortoiseGit Settings
2. 导航到: Git → Remote
3. 查看 "Putty Key" 字段,那里就是你的 PPK 路径

或者查找常见位置:
- `%USERPROFILE%\.ssh\*.ppk`
- `%USERPROFILE%\AppData\Local\PuTTY\*.ppk`

### 问题 4: Pageant 启动但密钥未加载

**验证方法:**
1. 双击系统托盘的 Pageant 图标
2. 查看 "Loaded Keys" 列表
3. 如果列表为空,说明 PPK 路径不正确

**修复:**
```batch
# 更新 start-pageant.bat 中的 PPK 路径
# 确保路径使用双引号
"C:\Program Files\PuTTY\pageant.exe" "%USERPROFILE%\.ssh\correct_key.ppk"
```

---

## 📋 配置检查清单

在第一次使用 `/windows-git-commit` 技能前,确认:

- [ ] Git 配置使用 plink: `git config --global core.sshcommand`
- [ ] Pageant 在运行: `tasklist | find /I pageant.exe`
- [ ] PPK 密钥路径正确
- [ ] Pageant 已加载 PPK 密钥(双击托盘图标验证)
- [ ] 测试 `git push` 成功(不需要密码)

---

## 🎯 配置完成后的效果

配置完成后,使用 `/windows-git-commit` 将:

1. ✅ 自动分析代码改动
2. ✅ 生成规范的提交信息
3. ✅ 自动提交到本地
4. ✅ 自动推送到远程(无需任何手动操作)
5. ✅ 不弹出任何对话框
6. ✅ 不需要输入密码
7. ✅ 完全在后台运行

---

## 📝 技能使用示例

配置完成后,你可以:

```bash
# 自动提交并推送(完全静默)
/windows-git-commit

# 使用自定义信息
/windows-git-commit feat: add user authentication

# 只提交不推送
/windows-git-commit commit locally only
```

所有操作都在后台自动完成,无需任何干预! 🎉

---

## 🔒 安全提示

1. **PPK 密钥安全:**
   - 不要将 PPK 密钥提交到 Git 仓库
   - 确保 `.gitignore` 包含 `*.ppk`
   - 定期备份 PPK 密钥到安全位置

2. **Pageant 安全:**
   - 为 PPK 密钥设置强密码
   - 只有在需要时才运行 Pageant
   - 锁屏电脑时 Pageant 继续运行(注意安全)

3. **自动启动安全:**
   - 确保只有你能访问 Windows 用户账户
   - 考虑使用 Windows 用户账户密码
   - 如果使用共享电脑,谨慎配置自动启动

---

## 📚 参考命令

```bash
# 查看 git SSH 配置
git config --global core.sshcommand

# 设置 git 使用 plink
git config --global core.sshcommand "plink"

# 查看 Pageant 进程
tasklist | find /I "pageant.exe"

# 查找 PPK 文件
dir %USERPROFILE%\*.ppk /s /b

# 测试 SSH 连接
plink -agent git@github.com

# 查看 git 远程配置
git remote -v
```

---

**配置完成后,享受完全自动化的 Git 操作吧!** 🚀
