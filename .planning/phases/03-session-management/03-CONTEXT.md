# Phase 3: Session Management - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver complete session lifecycle management including creation, listing, resuming, and deletion with working directory and model selection. Phase handles session CRUD operations and list navigation, but not the actual chat interface (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### 会话列表呈现

**布局与信息密度:**
- 采用紧凑列表行布局,中等密度行高
- 移动端卡片,桌面端列表,响应式混合布局
- 每个会话项显示:会话名称+工作目录路径、核心元数据(消息数量、最后活动时间)、模型标识、状态指示、Git分支
- 主点击导航到会话详情,右侧提供快速操作按钮(悬停显示)

**视觉呈现:**
- 会话状态使用徽章样式(Badge组件):idle→default, processing→secondary, waiting→outline, stopped→destructive
- 状态文本使用英文原文(Idle/Processing/Waiting/Stopped)
- 状态徽章包含文本+Lucide图标(如Loader处理中)
- 模型标识使用完整徽章(Haiku/Sonnet/Opus)
- Git分支显示完整分支名
- 消息数量显示为图标+数字
- 时间显示混合模式(1天内相对时间,超过显示绝对时间)

**交互与更新:**
- 列表更新通过Socket.IO实时推送
- 排序方式可选(最后活动时间/创建时间)
- 提供搜索(按会话名称)和筛选(按状态:全部/运行中/已停止)
- 支持可选分组(按状态/模型,提供分组切换)
- 快速操作按钮:快速删除、复制ID、停止/重启
- 桌面端悬停时显示快速操作按钮,移动端操作按钮常显
- 右键上下文菜单:删除、重命名、停止/重启、复制ID
- 首次加载显示Loading Spinner,加载失败显示Toast通知并保留上次数据

### 创建会话流程

**触发方式:**
- 多入口创建:会话列表顶部主按钮 + 侧边栏快捷按钮

**向导模式(4步):**
- 步骤1:工作目录选择(最近+浏览)
- 步骤2:模型选择(卡片选择,显示名称、特点、推荐用途)
- 步骤3:CLI参数配置(常用+高级,默认展开)
- 步骤4:确认(配置摘要,支持返回修改)
- 显示步骤指示器(如1/4),仅支持顺序导航(上一步/下一步)

**工作目录选择:**
- 混合模式:文件选择器 + 最近目录下拉(最近使用的5个工作目录,去重,最近优先排序)
- 支持三种输入方式:手动输入、文件选择器、拖拽文件夹
- 路径显示末尾目录名,鼠标悬停显示完整路径
- 拖拽时显示"放置文件夹"提示区域
- 选择后实时检测:路径有效性、Git仓库、Git分支、目录权限
  - 非Git仓库静默处理(无警告)
  - 无读写权限时阻止继续
- 手动输入路径时在提交时验证
- 最近目录使用localStorage持久化

**模型选择:**
- 卡片式选择,每个卡片显示模型名称、特点描述、推荐用途
- 默认选择Sonnet
- 不需要显示价格信息

**参数配置:**
- 常用参数:会话名称(自动生成,基于时间或目录名,后期支持修改)、--dangerously-skip-permissions开关、--permission-mode下拉选择、--diff开关
- 高级参数:默认展开,在参数步骤中显示
- 每个参数旁边显示问号图标,悬停显示说明(Tooltip)
- 实时验证:每步离开时验证,错误阻止下一步

**会话模板:**
- 支持保存常用配置为模板
- 在设置页面管理模板(创建和管理)
- 创建时提供"使用模板"快捷入口

**表单交互:**
- 中等尺寸模态框
- 支持基本快捷键(Enter下一步,Escape取消)
- 有内容填写时取消需确认
- 创建按钮显示加载Spinner,禁用按钮
- 创建成功自动导航到新会话详情页
- 创建失败保持模态框打开,允许修改后重试

**会话恢复:**
- 在会话列表中显示已停止的会话,点击可恢复
- 恢复选项对话框:继续(--continue)/恢复(--resume)/重新开始(新会话,相同工作目录,其他重新选择,名称不同)

### 会话状态指示

**徽章样式:**
- 使用shadcn/ui默认Badge变体
- 状态映射:idle→default, processing→secondary, waiting→outline, stopped→destructive
- 文本使用英文原文
- 包含文本+Lucide图标(Loader处理中,Circle空闲等)

### 会话删除交互

**单个删除:**
- 确认对话框显示:会话名称、工作目录、消息数量、"删除后无法恢复"警告文本
- 正在删除时显示全屏加载遮罩
- 删除成功:关闭对话框,显示成功Toast,从列表中移除该项(淡出+收缩动画)
- 删除失败:显示错误Toast,关闭确认对话框

**批量删除:**
- 复选框选择模式
- 列表顶部显示"删除选中(N)"按钮
- 批量删除需要二次确认
- 确认对话框列出所有会话名称(列表详情)
- 部分失败时显示详细报告(哪些成功/失败),保留失败的项

**删除入口:**
- 列表项快速操作按钮(悬停显示)
- 会话详情页操作菜单
- 批量操作(选择模式)
- 右键上下文菜单

**特殊场景:**
- 删除正在运行的会话:显示警告+确认(说明将先停止再删除)
- 在会话详情页删除:删除后自动返回会话列表

**视觉样式:**
- 删除按钮使用Ghost变Destructive样式(悬停时显示为Destructive)
- 不支持快捷删除(双击/Delete键)
- 不支持撤销删除功能

### Claude's Discretion
- 具体的动画时长和缓动函数
- Tooltip的具体样式和定位
- Toast通知的显示时长
- 加载Spinner的具体样式
- 错误消息的具体文案
- 模态框的具体尺寸(px值)
- 列表项的具体行高值
- 图标的具体尺寸
- 步骤指示器的具体样式

</decisions>

<specifics>
## Specific Ideas

**会话恢复语义:**
- "继续/恢复" = 使用已有会话,通过--continue或--resume参数
- "重新开始" = 创建全新会话,使用相同工作目录,但其他配置可重新选择,名称必须不同

**Git信息处理:**
- 选择工作目录后检测Git仓库和分支,行内显示
- 非Git仓库不显示警告,静默处理
- worktree信息由后端metadata字段提供(待研究确认)

**最近工作目录:**
- 使用localStorage持久化,最多保存5个
- 去重处理,最近优先排序
- 同时存储目录和Git信息

**重命名会话:**
- 名称自动生成(基于时间或目录名)
- 在会话详情页提供重命名功能
- 使用对话框(prompt)方式重命名

</specifics>

<deferred>
## Deferred Ideas

- 会话模板功能的具体实现 — 在设置页面实现(Phase 6或更晚)
- 批量操作的其他类型(如批量停止、批量重启) — 未来阶段考虑
- 会话分组的高级功能(如按项目分组) — 未来阶段考虑
- 会话收藏/置顶功能 — 添加到backlog
- 会话导入/导出功能 — 未来阶段考虑

</deferred>

---

*Phase: 03-session-management*
*Context gathered: 2026-02-07*
