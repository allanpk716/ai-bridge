# Phase 01: Foundation & UI Infrastructure - Research

**研究日期:** 2026-02-06
**状态:** 规划就绪
**目标:** "我需要知道什么才能很好地规划这个阶段?"

---

## 核心问题解答

### 1. 我们要构建什么?

Phase 01 建立项目的 **基础设施层** —— 不包含任何业务功能,仅提供应用的结构框架。包括:

- **路由系统** - 客户端路由,无需页面刷新的导航
- **布局框架** - 响应式主从视图布局(桌面端固定侧边栏,移动端抽屉导航)
- **主题系统** - 深色/浅色模式切换,支持系统偏好检测,持久化到 localStorage
- **组件库集成** - shadcn/ui 基础组件(Button, Input, Card 等)
- **响应式基础** - 移动优先的响应式设计,支持桌面/平板/移动端

**明确不包含:**
- ❌ 后端通信(Phase 2)
- ❌ 会话管理功能(Phase 3)
- ❌ 消息交互(Phase 4)
- ❌ PWA 功能(Phase 5)

---

## 技术选型验证

### React 19.2 + Vite + TypeScript ✅

**确认理由:**
- React 19.2 自 2024年12月生产就绪,提供新特性(Activity, useEffectEvent, cacheSignal)
- Vite 提供极快的 HMR 和优化的生产构建
- TypeScript 提供类型安全和卓越的开发体验
- **版本兼容性:** React 19.2 完全兼容 Vite 5.4+ 和 React Router 7.9+

**HAPI 参考实现验证:**
```json
// tmp/hapi/web/package.json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "vite": "^7.3.0",
  "typescript": "^5.9.3"
}
```

---

### React Router 7.9 ✅

**选择模式:**
根据研究,**推荐使用 React Router 7 的 `declarative` 模式**(非 framework 模式),原因:

1. **灵活性:** 配置式路由更适合 AI-Bridge-Web 的复杂布局需求
2. **兼容性:** 与 Vite 无缝集成,无需额外配置
3. **代码分割:** 支持懒加载路由组件
4. **类型安全:** 完整的 TypeScript 支持

**路由结构决策:**
```typescript
// 推荐配置(declarative 模式)
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <SessionList /> },  // 首页 = 会话列表
      { path: 'sessions/:id', element: <SessionDetail /> }  // 会话详情
    ]
  }
]
```

**替代方案 - Framework 模式(不推荐):**
- React Router 7 支持类似 Remix 的文件系统路由(`@react-router/fs-routes`)
- 但研究显示:文件约定对小型项目显得笨重,配置式更灵活
- HAPI 使用 TanStack Router(更强大,但学习曲线陡峭),我们选择 React Router 足够

---

### Tailwind CSS + shadcn/ui ✅

**Tailwind CSS 版本:**
- **选择 Tailwind CSS v4.1.x** (最新稳定版,2026年1月发布)
- 使用新的 `@tailwindcss/vite` 插件,配置更简洁
- 移动优先响应式设计默认支持

**shadcn/ui 集成步骤:**
1. 初始化: `npx shadcn@latest init`
2. 选择配置:
   - **Style:** "new-york" 或 "default"
   - **Base color:** neutral (适合 AI 工具)
   - **CSS variables:** true (主题切换必需)
3. 添加组件: `npx shadcn@latest add button input card dialog`

**主题系统架构:**
```typescript
// 使用 CSS 变量 + Tailwind dark mode
// tailwind.config.js
export default {
  darkMode: ['class'],  // 手动控制 .dark 类
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... shadcn/ui 默认变量
      }
    }
  }
}
```

**主题切换实现:**
- **不使用 next-themes** (专为 Next.js 优化,有 SSR 闪烁问题处理)
- **自定义方案:** 使用 `useEffect` + `localStorage` + `matchMedia`
- **关键点:**
  - 默认主题: `'system'` (跟随系统)
  - 持久化: `localStorage.getItem('theme')`
  - 检测系统: `window.matchMedia('(prefers-color-scheme: dark)')`
  - 切换类名: `document.documentElement.classList.toggle('dark')`

---

### TanStack Query + Socket.IO (Phase 2,本阶段不涉及)

**本阶段仅设置配置结构,不实现实际通信。**

---

## 关键技术决策

### 1. 响应式策略

**Tailwind 断点(已确认):**
```
sm: 640px   # 小屏幕/大手机横屏
md: 768px   # 平板竖屏
lg: 1024px  # 平板横屏/小笔记本
xl: 1280px  # 桌面显示器
```

**主从视图布局:**
```tsx
// 桌面端 (md+): 固定侧边栏
<div className="flex md:static">
  <aside className="hidden md:block w-80 fixed h-full">
    {/* 会话列表 */}
  </aside>
  <main className="flex-1 md:ml-80">
    {/* 会话详情 */}
  </main>
</div>

// 移动端 (< md): 抽屉导航
<div className="md:hidden">
  <button onClick={() => setDrawerOpen(true)}>☰</button>
  <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
    {/* 会话列表 */}
  </Drawer>
  <main>
    {/* 会话详情 */}
  </main>
</div>
```

---

### 2. 移动端抽屉导航

**手势实现选项:**

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **react-swipeable** | 轻量(7.0.2, 1kb), TypeScript 支持 | 需要自己编写抽屉组件 | ⭐⭐⭐⭐⭐ |
| Radix UI Dialog | shadcn/ui 内置 | 无手势支持,需手动添加 | ⭐⭐⭐ |
| 手动实现 touch 事件 | 完全控制 | 需处理各种边界情况 | ⭐⭐ |

**推荐方案: react-swipeable + 手势边缘检测**
```bash
npm install react-swipeable
```

**实现要点:**
```tsx
import { useSwipeable } from 'react-swipeable'

function SwipeableDrawer({ isOpen, onClose }) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onClose(),
    onSwiping: (e) => {
      // 只在左边缘触发 (e.event.clientX < 50)
    },
    trackMouse: true  // 桌面端也支持鼠标拖动
  })

  return (
    <div {...handlers} className={`fixed inset-y-0 left-0 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* 抽屉内容 */}
    </div>
  )
}
```

**关键参数:**
- `swipeEdgeWidth`: 左边缘触发区域宽度(建议 20-30px)
- `swipeMinDistance`: 最小滑动距离(建议 50px)
- **iOS 兼容性:** iOS 浏览器默认侧滑返回导航,需要 `touch-action: pan-y` 禁用冲突

---

### 3. 顶部导航栏自动隐藏

**实现模式:** 向下滚动隐藏,向上滚动显示
```typescript
const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
const [lastScrollY, setLastScrollY] = useState(0)

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY) {
      setScrollDirection('down')  // 隐藏
    } else {
      setScrollDirection('up')    // 显示
    }
    setLastScrollY(currentScrollY)
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [lastScrollY])
```

**Tailwind 类名:**
```tsx
<nav className={`fixed top-0 w-full z-40 transition-transform duration-300 ${
  scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
}`}>
  {/* 导航内容 */}
</nav>
```

---

### 4. 主题切换过渡效果

**关键发现: 避免闪烁**
- **问题:** 页面加载时可能出现亮色闪烁
- **解决:** 在 `<head>` 中注入内联脚本,在 React 挂载前应用主题

```html
<!-- index.html -->
<head>
  <script>
    // 在 React 渲染前立即应用主题,避免闪烁
    (function() {
      const theme = localStorage.getItem('theme') || 'system'
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      if (isDark) {
        document.documentElement.classList.add('dark')
      }
    })()
  </script>
</head>
```

**过渡动画:**
```css
/* globals.css */
html {
  transition: background-color 300ms ease, color 300ms ease;
}
```

---

### 5. 面包屑导航

**决策:** 面包屑放在顶部导航栏中间,展示当前位置
```tsx
<nav className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center gap-2">
    {/* 移动端汉堡菜单 */}
    <button className="md:hidden" onClick={toggleDrawer}>☰</button>
    {/* Logo */}
    <Logo />
  </div>

  {/* 面包屑 - 仅在会话详情页显示 */}
  <Breadcrumb className="hidden md:flex">
    <BreadcrumbItem href="/">会话列表</BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>会话详情</BreadcrumbItem>
  </Breadcrumb>

  {/* 右侧操作区 */}
  <div className="flex items-center gap-2">
    <ConnectionStatus />
  </div>
</nav>
```

---

## 实现计划拆分建议

根据研究结果,Phase 01 建议拆分为 **5 个 Plans**:

### Plan 01-01: 项目脚手架
**目标:** 创建 Vite + React 19 + TypeScript 项目,配置基础工具链

**关键任务:**
1. 使用 `npm create vite@latest ai-bridge-web -- --template react-ts` 创建项目
2. 配置 `tsconfig.json` 路径别名 (`@/*` → `./src/*`)
3. 配置 `vite.config.ts`:
   - 路径解析
   - 开发服务器端口 3000
   - 代理配置(为 Phase 2 准备:`/api` → `http://localhost:8080`)
4. 安装依赖:
   - `react@19.2 react-dom@19.2`
   - `@vitejs/plugin-react`
5. 配置 ESLint + Prettier

**成功标准:**
- `npm run dev` 启动无错误
- TypeScript 编译通过
- 可以从 `@/components/Button` 导入组件

---

### Plan 01-02: React Router 设置
**目标:** 配置路由结构和导航组件

**关键任务:**
1. 安装 `react-router@7.9`
2. 创建路由配置(`src/router/index.tsx`):
   - `/` → `<SessionList />`
   - `/sessions/:id` → `<SessionDetail />`
3. 创建布局组件:
   - `<RootLayout />` - 顶层容器
   - `<MainLayout />` - 顶部导航 + 主内容区
4. 实现面包屑组件(暂无实际链接,仅占位)
5. 配置 `<Outlet />` 渲染子路由

**成功标准:**
- 访问 `/` 显示会话列表占位页
- 访问 `/sessions/123` 显示会话详情占位页
- 面包屑正确显示 "会话列表 > 会话详情"

---

### Plan 01-03: shadcn/ui 集成
**目标:** 安装组件库并添加基础组件

**关键任务:**
1. 安装并配置 Tailwind CSS v4:
   - `npm install -D tailwindcss @tailwindcss/vite`
   - `@import "tailwindcss"` 到 `src/index.css`
2. 运行 `npx shadcn@latest init`:
   - 选择 "new-york" 风格
   - 启用 CSS variables
   - 配置 `@/` 别名
3. 添加基础组件:
   - `npx shadcn@latest add button input card badge dialog`
4. 创建示例页面验证组件渲染:
   - `<Button>点击测试</Button>`
   - `<Card><Input placeholder="测试输入" /></Card>`

**成功标准:**
- Button、Input、Card 组件在所有断点下正确渲染
- shadcn/ui 图标(lucide-react)可用
- Tailwind 类名生效

---

### Plan 01-04: 主题系统
**目标:** 实现深色/浅色模式切换

**关键任务:**
1. 创建 `useTheme` hook:
   - 从 localStorage 读取主题
   - 监听系统主题变化(`matchMedia`)
   - 提供 `setTheme('light' | 'dark' | 'system')`
2. 创建 `<ThemeProvider />` 组件:
   - 包裹整个应用
   - 在 `<head>` 注入防闪烁脚本
3. 创建 `<ThemeToggle />` 组件:
   - 位置:**侧边栏底部**(决策已确认)
   - 图标:太阳/月亮/自动
   - 点击循环切换: light → dark → system → light
4. 配置 Tailwind `darkMode: 'class'`
5. 定义 CSS 变量:
   - `--background` / `--foreground`
   - `--primary` / `--secondary`
   - `--accent` / `--muted`

**成功标准:**
- 切换主题无闪烁(平滑过渡 300ms)
- 刷新页面主题保持
- 选择 "system" 时跟随系统主题
- 所有组件在深色/浅色模式下显示正常

---

### Plan 01-05: 响应式布局框架
**目标:** 实现主从视图布局,移动端抽屉导航

**关键任务:**
1. 创建 `<TopNav />` 组件:
   - Logo + 面包屑 + 连接状态
   - 移动端自动隐藏(向下滚动隐藏,向上滚动显示)
2. 创建 `<Sidebar />` 组件:
   - 桌面端:固定宽度(w-80,320px),左侧定位
   - 移动端:抽屉模式,从左侧滑出
3. 实现移动端抽屉:
   - 安装 `react-swipeable`
   - 左边缘滑动手势(20-30px 触发区域)
   - 汉堡菜单图标触发
   - 背景遮罩层
4. 创建主布局结构:
   ```tsx
   <div className="flex h-screen overflow-hidden">
     {/* 桌面端侧边栏 */}
     <aside className="hidden md:block w-80">
       <Sidebar />
     </aside>

     {/* 主内容区 */}
     <div className="flex-1 flex flex-col">
       <TopNav />
       <main className="flex-1 overflow-y-auto">
         <Outlet />
       </main>
     </div>

     {/* 移动端抽屉 */}
     <MobileDrawer />
   </div>
   ```
5. 响应式测试:
   - 手机竖屏(< 640px)
   - 平板竖屏(640px - 1024px)
   - 桌面端(> 1024px)

**成功标准:**
- 桌面端:侧边栏固定显示
- 移动端:侧边栏默认隐藏,滑动手势打开
- 顶部导航栏在移动端滚动时自动隐藏/显示
- 所有屏幕尺寸下布局无破版

---

## 潜在风险与缓解策略

### 风险 1: iOS 浏览器侧滑手势冲突
**问题:** iOS Safari 的左滑返回手势可能与抽屉打开手势冲突

**缓解方案:**
1. 限制触发区域为左边缘 20-30px
2. 添加 `touch-action: pan-y` 禁用水平触摸冲突
3. 检测 iOS 环境,降低手势灵敏度
```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const edgeWidth = isIOS ? 20 : 30  // iOS 使用更窄的边缘区域
```

---

### 风险 2: 主题切换闪烁
**问题:** 页面加载时可能出现亮色内容闪烁

**缓解方案:**
1. **关键:** 在 `index.html` 的 `<head>` 中注入内联脚本
2. 使用 `suppressHydrationWarning` 属性(React 18+)
3. 禁用 `<html>` 标签的 CSS 过渡,仅对 `<body>` 应用过渡

---

### 风险 3: shadcn/ui 与 Tailwind v4 兼容性
**问题:** Tailwind v4 语法变化可能导致 shadcn/ui 组件样式异常

**验证方案:**
1. 研究显示 Tailwind v4 完全向后兼容 v3
2. shadcn/ui 官方已更新文档支持 Tailwind v4
3. 关键变化:`@tailwind` 指令 → `@import "tailwindcss"`
4. **建议:** 使用 `@tailwindcss/postcss` 插件(官方推荐)

---

### 风险 4: React Router 7 配置模式选择
**问题:** framework 模式 vs declarative 模式选择不当导致后期重构

**决策依据:**
1. **HAPI 使用 TanStack Router**(更强大但复杂),我们不需那么强大
2. React Router 7 的 framework 模式适合全栈应用(SSR),我们是 SPA
3. **结论:** 使用 declarative 模式 + 配置文件路由

---

## 参考实现研究

### HAPI 前端架构分析

**项目结构:**
```
tmp/hapi/web/src/
├── api/           # API 客户端(axios)
├── chat/          # 聊天状态管理(reducer + reconcile)
├── components/    # UI 组件
│   ├── AssistantChat/  # 聊天主界面
│   ├── NewSession/     # 新建会话对话框
│   ├── SessionList.tsx # 会话列表(重要参考)
│   └── ui/             # 基础组件(button, card 等)
├── hooks/         # 自定义 hooks(queries, mutations)
├── lib/           # 工具库(验证, 国际化)
└── App.tsx        # 根组件
```

**SessionList.tsx 关键模式:**
1. **会话分组:** 按目录分组(`groupSessionsByDirectory`)
2. **可折叠组:** 使用 `useState<Map>` 管理折叠状态
3. **长按菜单:** `useLongPress` hook 触发上下文菜单
4. **状态指示器:** 颜色点表示会话状态(蓝色=思考中,绿色=活跃,灰色=空闲)
5. **相对时间:** `formatRelativeTime` 格式化时间戳

**可复用模式:**
- 分组逻辑 → Phase 3 会话列表
- 状态指示器 → Phase 3 连接状态组件
- 长按手势 → Phase 1 抽屉导航参考

---

### HAPI 主题系统分析

**实现方式:**
```typescript
// hooks/useTheme.ts
export function initializeTheme() {
  const theme = localStorage.getItem('theme') || 'system'
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}
```

**关键发现:**
- HAPI 不使用 next-themes(非 Next.js 项目)
- 手动管理 localStorage + matchMedia
- **防闪烁:** 在 `App.tsx` 的 `useEffect` 中立即调用 `initializeTheme()`

**AI-Bridge-Web 改进:**
- 在 `index.html` 中注入脚本,比 React `useEffect` 更早执行
- 支持三态切换: light / dark / system

---

## 技术栈总结

### 确认使用 ✅
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.x | UI 框架 |
| Vite | 5.4+ / 6.x | 构建工具 |
| TypeScript | 5.7.x | 类型安全 |
| Tailwind CSS | 4.1.x | 样式系统 |
| shadcn/ui | 2.9+ | 组件库 |
| React Router | 7.9+ | 客户端路由 |
| react-swipeable | 7.0.2 | 手势处理 |

### 明确不使用 ❌
| 技术 | 拒绝原因 |
|------|----------|
| Create React App | 已废弃,构建慢 |
| React Router v6 | 不支持 React 19 新特性 |
| next-themes | 专为 Next.js 优化 |
| Redux | 过度设计,TanStack Query 更好 |
| Styled Components | 性能差,Tailwind 更优 |

---

## 关键配置示例

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... shadcn/ui 默认颜色
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

### components.json (shadcn/ui 配置)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## 成功标准验证清单

### UI-01: 移动优先响应式设计 ✅
- [ ] 在 375px(iPhone SE)宽度下布局无破版
- [ ] 在 768px(iPad)宽度下侧边栏转换为抽屉
- [ ] 在 1280px(桌面)宽度下侧边栏固定显示
- [ ] 所有组件使用相对单位(rem, %, flex)

### UI-02: 用户交互视觉反馈 ✅
- [ ] 主题切换有 300ms 过渡动画
- [ ] 抽屉打开/关闭有平滑滑动手势
- [ ] 按钮悬停/点击有视觉反馈
- [ ] **注意:** 本阶段不实现加载/流式指示器(Phase 2+)

### Phase 01 特定标准 ✅
1. [ ] 应用在移动/平板/桌面端正常渲染
2. [ ] 主题切换无闪烁,偏好持久化
3. [ ] 所有路由无页面刷新导航
4. [ ] 基础组件(Button/Input/Card)在所有断点正确渲染

---

## 下一步行动

1. **创建 Plan 01-01:** 项目脚手架
2. **等待用户确认:** 技术选型和实现计划是否符合预期
3. **开始实施:** 按照 5 个 Plans 顺序执行

---

## 参考资料

### 高置信度来源(Context7 + 官方文档)
- `/facebook/react` (v19.2.0) — React 19 新特性,生产就绪状态
- `/vitejs/vite` (v5.4.21, v7.0.0) — Vite 配置,TypeScript 支持
- `/websites/ui_shadcn` — shadcn/ui 安装,Vite 配置
- `/websites/v3_tailwindcss` — Tailwind CSS v3.4,移动优先设计
- `/tanstack/query` (v5.84.1) — TanStack Query 集成
- `/websites/socket_io_v4_client-api` — Socket.IO 客户端

### 中等置信度来源(Web Search + 验证)
- React Router 7 教程 — 声明式路由配置
- next-themes 文档 — 主题切换最佳实践(虽然不使用,但参考实现)
- react-swipeable GitHub — 手势处理 API
- Tailwind CSS 响应式侧边栏教程 — 移动优先布局模式

### HAPI 参考实现
- `tmp/hapi/web/src/App.tsx` — 应用结构,主题初始化
- `tmp/hapi/web/src/components/SessionList.tsx` — 会话列表实现
- `tmp/hapi/web/package.json` — 依赖版本参考

---

**研究完成时间:** 2026-02-06
**研究者:** Claude Code (Sonnet 4.5)
**文档版本:** 1.0
