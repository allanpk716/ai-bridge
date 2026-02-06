# Phase 1: Foundation & UI Infrastructure - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish project infrastructure with routing, base layout, theming system, and responsive design scaffolding. This phase does NOT include backend communication, session management, or any feature functionality — it only provides the structural foundation for the application.

</domain>

<decisions>
## Implementation Decisions

### 路由结构
- 会话列表作为首页(/)
- 会话详情页使用 /sessions/:id 路径格式
- 设置不需要单独页面(主题和连接配置内嵌在会话列表中)
- 需要面包屑导航(会话列表 > 会话详情)
- 会话详情页采用主从视图(Master-Detail)布局
  - 桌面端:左侧会话列表,右侧详情区域
  - 移动端:抽屉式导航切换

### 响应式策略
- 使用 Tailwind 默认断点: sm(640px), md(768px), lg(1024px), xl(1280px)
- 移动端(< 768px)主从视图侧边栏转换为抽屉式导航
  - 从屏幕左侧滑出
  - 支持滑动手势触发(左边缘向右滑动)
  - 支持汉堡菜单图标触发
- 移动端查看会话详情时,顶部导航栏自动隐藏
  - 向下滚动时隐藏,向上滚动时显示
- 移动端代码块查看方式与桌面端统一处理
- 移动端权限请求和重要通知使用 Toast 提示

### 布局结构
- 主布局采用顶部导航栏 + 侧边栏 + 主内容区域的组合结构
- 顶部导航栏固定,包含:
  - Logo
  - 面包屑导航
  - 主题切换按钮
  - 连接状态指示器
- 桌面端:侧边栏固定显示会话列表
- 移动端:侧边栏变为抽屉,默认隐藏

### 主题切换体验
- 主题切换按钮放在侧边栏中
- 默认主题跟随系统主题
- 主题切换时使用平滑过渡效果(200-300ms 淡入淡出)
- 主题偏好持久化到 localStorage

### Claude's Discretion
- 主题切换按钮在侧边栏中的具体位置
- 抽屉导航的宽度和动画细节
- 面包屑导航的视觉样式
- 顶部导航栏的高度和间距

</decisions>

<specifics>
## Specific Ideas

- 移动端抽屉导航需要支持左边缘滑动手势,提供类似原生 App 的体验
- 顶部导航栏在移动端的自动隐藏行为应该参考常见的移动应用模式
- 主题切换的过渡效果需要平滑自然,避免突兀的闪烁

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-ui-infrastructure*
*Context gathered: 2026-02-06*
