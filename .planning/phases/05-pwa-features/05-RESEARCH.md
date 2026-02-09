# Phase 5: PWA Features - Research

**Researched:** 2026-02-09
**Domain:** Progressive Web App (PWA) implementation with Vite + React
**Confidence:** HIGH

## Summary

本阶段研究聚焦于为现有的 React + Vite + TypeScript 项目添加 PWA 功能。通过调研发现,`vite-plugin-pwa` 是 Vite 生态系统中最成熟、功能最完整的 PWA 解决方案,它基于 Workbox 构建,提供了零配置的默认实现,同时支持高度定制化。

核心发现包括:
1. **标准工具**: `vite-plugin-pwa` (v0.17+) 是业界标准选择,与 Vite 5+ 深度集成
2. **Service Worker 策略**: 使用 `generateSW` 策略即可满足需求,无需手动编写 service worker
3. **更新管理**: 使用 `registerType: 'prompt'` 配合 `useRegisterSW` hook 实现自定义更新提示
4. **离线检测**: 使用浏览器原生 `navigator.onLine` API 和 `online`/`offline` 事件
5. **安装提示**: 通过监听 `beforeinstallprompt` 事件实现自定义安装按钮

**Primary recommendation:** 使用 `vite-plugin-pwa` 配合 `@vite-pwa/assets-generator` 实现完整的 PWA 功能,包括自动图标生成、离线检测、更新提示和安装管理。

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite-plugin-pwa` | ^0.17.0 | PWA 功能核心插件 | Vite 官方推荐的 PWA 解决方案,零配置,基于 Workbox v7 |
| `@vite-pwa/assets-generator` | ^0.2.0 | PWA 图标和资源生成 | 自动生成所有尺寸的图标、启动画面等资源 |
| `workbox-window` | ^7.0.0 | Service Worker 更新管理 | vite-plugin-pwa 依赖,用于处理 SW 更新和缓存 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `virtual:pwa-register/react` | 内置虚拟模块 | React PWA hook | 使用 `useRegisterSW` hook 管理更新提示 |
| `virtual:pwa-register` | 内置虚拟模块 | 通用注册模块 | 需要更底层的 SW 控制时使用 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vite-plugin-pwa` | `workbox` (手动配置) | vite-plugin-pwa 提供零配置和 Vite 集成,手动配置复杂且易出错 |
| `generateSW` 策略 | `injectManifest` 策略 | generateSW 满足 95% 需求,injectManifest 仅用于高度自定义场景 |
| `@vite-pwa/assets-generator` | 手动准备图标 | 资源生成器自动化处理所有尺寸和格式,手动工作量大 |

**Installation:**

```bash
npm install -D vite-plugin-pwa @vite-pwa/assets-generator workbox-window
```

## Architecture Patterns

### Recommended Project Structure

```
web/
├── public/
│   ├── logo.svg              # 源图标(用于生成所有 PWA 图标)
│   └── favicon.ico           # 备用 favicon
├── src/
│   ├── components/
│   │   ├── pwa/
│   │   │   ├── UpdatePrompt.tsx      # 更新提示对话框
│   │   │   ├── OfflineBanner.tsx     # 离线状态横幅
│   │   │   └── InstallButton.tsx     # 安装按钮(可选)
│   │   └── ...
│   ├── hooks/
│   │   └── useOnlineStatus.ts        # 离线检测 hook
│   ├── main.tsx                       # 注册 SW 入口
│   └── ...
├── pwa-assets.config.ts               # PWA 资源生成配置
└── vite.config.ts                     # Vite PWA 插件配置
```

### Pattern 1: Vite PWA 插件配置

**What:** 在 `vite.config.ts` 中配置 PWA 插件,包括 manifest、缓存策略和更新行为

**When to use:** 所有基于 Vite 的 PWA 项目

**Example:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 使用 prompt 模式:发现新版本时提示用户更新
      registerType: 'prompt',

      // 包含静态资源
      includeAssets: ['favicon.ico', 'robots.txt'],

      // PWA manifest 配置
      manifest: {
        name: 'AI-Bridge',
        short_name: 'AIBridge',
        description: 'Claude Code CLI Remote Access Middleware',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'  // 支持自适应图标
          }
        ]
      },

      // Workbox 配置
      workbox: {
        // 仅缓存静态资源
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // 清理过期缓存
        cleanupOutdatedCaches: true,

        // 不缓存 API 响应(根据项目需求)
        runtimeCaching: []  // 空数组表示不缓存动态内容
      },

      // 开发环境配置(可选)
      devOptions: {
        enabled: false,  // 生产环境启用 PWA
        suppressWarnings: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Source:** https://github.com/vite-pwa/vite-plugin-pwa (HIGH confidence)

### Pattern 2: PWA 资源自动生成

**What:** 使用 `@vite-pwa/assets-generator` 从单个源图标自动生成所有必需的 PWA 资源

**When to use:** 需要支持多种设备和场景的 PWA 项目

**Example:**

```typescript
// pwa-assets.config.ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // 自定义图标配置
    maskable: {
      sizes: [512],
      padding: 0.1  // 自适应图标内边距
    },
    apple: {
      sizes: [180],
      padding: 0.1
    }
  },
  images: ['public/logo.svg']  // 源图标路径
})
```

```bash
# 生成 PWA 资源
npx pwa-assets-generator
```

**Source:** https://github.com/vite-pwa/assets-generator (HIGH confidence)

### Pattern 3: Service Worker 注册和更新提示

**What:** 使用 React hook `useRegisterSW` 管理 SW 生命周期和更新提示

**When to use:** 需要自定义更新 UI 的 React 应用

**Example:**

```typescript
// src/components/pwa/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl, registration) {
      console.log('SW registered:', swScriptUrl, registration)

      // 可选:配置定期检查更新(例如每小时)
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // 仅在有更新时显示对话框
  if (!needRefresh) return null

  return (
    <Dialog open={needRefresh} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发现新版本</DialogTitle>
          <DialogDescription>
            应用已更新到最新版本,点击下方按钮立即更新。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => updateServiceWorker(true)}>
            立即更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Source:** https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/frameworks/react.md (HIGH confidence)

### Pattern 4: 离线检测 Hook

**What:** 使用浏览器原生 API 检测网络状态变化

**When to use:** 需要在离线时禁用特定功能的应用

**Example:**

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

```typescript
// src/components/pwa/OfflineBanner.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff, Loader2 } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="h-5 w-5" />
      <span className="font-medium">您当前处于离线状态</span>
      <span className="text-sm opacity-90">部分功能不可用</span>
    </div>
  )
}
```

**Source:** MDN Navigator.onLine API + multiple community examples (MEDIUM confidence)

### Pattern 5: PWA 安装提示(可选)

**What:** 监听 `beforeinstallprompt` 事件提供自定义安装按钮

**When to use:** 需要更友好的安装引导(非强制)

**Example:**

```typescript
// src/components/pwa/InstallButton.tsx
import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // 阻止默认安装提示
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // 显示浏览器安装对话框
    deferredPrompt.prompt()

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <Button onClick={handleInstall} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      安装应用
    </Button>
  )
}
```

**Source:** web.dev customize-install (HIGH confidence)

### Anti-Patterns to Avoid

- **自动弹出更新提示**: 用户可能正在进行重要操作,应该选择合适的时机提示
- **缓存 API 响应**: 除非有明确的离线编辑需求,否则不应缓存动态内容
- **使用过时的 PWA 配置**: 例如使用 `injectRegister: 'inline'` 而非默认的 `auto`
- **忽略主题适配**: PWA 图标和主题色应该适配深色/浅色主题
- **过度使用 `injectManifest`**: 90% 的场景 `generateSW` 已经足够

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service Worker 缓存策略 | 手动编写 cache 逻辑 | Workbox (vite-plugin-pwa 内置) | 处理边界情况、缓存失效、版本管理 |
| 图标生成和优化 | 手动裁剪多种尺寸 | `@vite-pwa/assets-generator` | 自动生成所有平台所需尺寸和格式 |
| PWA manifest 配置 | 从零编写 JSON | `vite-plugin-pwa` manifest 选项 | 自动注入、类型安全、最佳实践 |
| 离线检测 | 复杂的网络请求检测 | `navigator.onLine` + 事件监听 | 浏览器原生 API,可靠且简单 |
| SW 更新管理 | 手动比较版本号 | `workbox-window` + `useRegisterSW` | 处理 SW 生命周期、跳过等待、重新加载 |

**Key insight:** PWA 实现涉及很多浏览器兼容性问题和边缘情况(如 SW 更新的时间启发式算法),使用成熟工具可以避免踩坑。

## Common Pitfalls

### Pitfall 1: Service Worker 更新时间启发式算法

**What goes wrong:** 用户报告更新提示有时显示"准备离线工作"而非"新版本可用"

**Why it happens:** `workbox-window` 使用基于时间的启发式算法,如果距离上次 SW 注册少于 1 分钟,会将 `service worker update found` 事件视为外部事件

**How to avoid:**
- 测试更新时等待至少 1 分钟后再重新构建
- 或者在开发环境禁用此行为: `devOptions: { enabled: true }`

**Warning signs:** 更新提示内容不符合预期,测试时出现不一致的行为

**Source:** vite-plugin-pwa docs (HIGH confidence)

### Pitfall 2: 缓存策略不当导致数据陈旧

**What goes wrong:** 用户看到过期的会话列表或消息内容

**Why it happens:** 不小心配置了 API 响应的 `runtimeCaching`

**How to avoid:**
- 仅在 `workbox.globPatterns` 中包含静态资源
- 保持 `runtimeCaching` 为空数组,除非有明确的离线需求

**Warning signs:** 用户报告数据不刷新,刷新页面后仍显示旧内容

### Pitfall 3: TypeScript 类型错误

**What goes wrong:** IDE 报错"Cannot find module 'virtual:pwa-register/react'"

**Why it happens:** 未在 `tsconfig.json` 中添加类型声明

**How to avoid:**

```json
{
  "compilerOptions": {
    "types": ["vite-plugin-pwa/react"]
  }
}
```

或在 `vite-env.d.ts` 中添加:

```typescript
/// <reference types="vite-plugin-pwa/react" />
```

**Source:** vite-plugin-pwa FAQ (HIGH confidence)

### Pitfall 4: iOS Safari 不支持 beforeinstallprompt

**What goes wrong:** iOS 用户看不到自定义安装按钮

**Why it happens:** iOS Safari 不支持 `beforeinstallprompt` 事件,用户必须通过"分享"菜单手动添加到主屏幕

**How to avoid:**
- 在 iOS 上显示引导提示,告知用户如何手动安装
- 或使用浏览器默认安装体验(不阻止 `beforeinstallprompt`)

**Warning signs:** iOS 测试时安装按钮不显示

### Pitfall 5: 开发环境 PWA 不生效

**What goes wrong:** 开发模式下 PWA 功能不工作,怀疑配置错误

**Why it happens:** 默认情况下 PWA 仅在生产环境启用

**How to avoid:**
```typescript
devOptions: {
  enabled: true,  // 开发环境启用 PWA(用于测试)
  suppressWarnings: true
}
```

**Source:** vite-plugin-pwa development docs (HIGH confidence)

## Code Examples

Verified patterns from official sources:

### Minimal PWA Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
}
```

**Source:** vite-plugin-pwa getting started (HIGH confidence)

### Register Service Worker in main.tsx

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 注册 service worker(仅在生产环境)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // 使用虚拟模块自动注册
  import('virtual:pwa-register/react').then(({ registerSW }) => {
    registerSW({
      onOfflineReady() {
        console.log('App ready to work offline')
      }
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Source:** vite-plugin-pwa React docs (HIGH confidence)

### HTML Entry Point Minimal Requirements

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI-Bridge</title>
    <meta name="description" content="Claude Code CLI Remote Access Middleware" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
    <meta name="theme-color" content="#ffffff" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Source:** vite-plugin-pwa PWA minimal requirements (HIGH confidence)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 手动配置 Workbox | `vite-plugin-pwa` 零配置 | 2020+ | 大幅降低 PWA 开发门槛 |
| 手动准备多种尺寸图标 | `@vite-pwa/assets-generator` 自动生成 | 2023+ | 图标准备从数小时降至数分钟 |
| 使用 `injectRegister: 'inline'` | `injectRegister: 'auto'`(默认) | v0.12.2+ | 更灵活的注册方式,支持虚拟模块 |
| 手动处理 SW 更新 | `useRegisterSW` hook | v0.14+ | React 集成更简洁,类型安全 |

**Deprecated/outdated:**
- **Create React App 内置 PWA**: CRA 官方已不再推荐使用,建议使用 Vite + vite-plugin-pwa
- **`serviceworker-webpack-plugin`**: Webpack 生态的旧方案,Vite 有更好的替代品
- **`registerType: 'autoUpdate'` 无条件使用**: 可能导致用户数据丢失,应谨慎使用

## Open Questions

1. **PWA 图标主题适配**
   - What we know: manifest 可以配置多个图标,vite-plugin-pwa 支持深色/浅色主题
   - What's unclear: 如何让图标自动适配用户的系统主题设置
   - Recommendation: 使用 SVG 格式图标,或准备深色/浅色两套图标并通过 media query 选择

2. **更新提示的触发时机**
   - What we know: `onNeedRefresh` 会在检测到新 SW 时触发
   - What's unclear: 是否应该在用户完成某个操作后再提示更新(避免打断)
   - Recommendation: 实现"稍后提醒"功能,在用户空闲时再提示

3. **iOS 安装体验**
   - What we know: iOS 不支持 `beforeinstallprompt`
   - What's unclear: 最佳的 iOS 安装引导 UI 设计
   - Recommendation: 参考 Twitter Lite、GitHub 等成熟 PWA 的做法,使用模态对话框+步骤截图

## Sources

### Primary (HIGH confidence)

- **/vite-pwa/vite-plugin-pwa** - Configuration, React integration, offline detection, update prompts, manifest setup
- **https://github.com/vite-pwa/vite-plugin-pwa** - Official GitHub repository with examples and documentation
- **https://web.dev/articles/customize-install** - Official guide on PWA installation prompts
- **MDN Navigator.onLine API** - Browser-native online/offline detection

### Secondary (MEDIUM confidence)

- **https://css-tricks.com/vitepwa-plugin-offline-service-worker/** - Practical tutorial with React examples
- **https://dev.to/dzungnt98/detecting-online-offline-status-in-react-443e** - Custom hook for online status (verified against MDN)
- **https://www.velotio.com/engineering-blog/building-pwa-in-react** - Real-world PWA implementation patterns
- **Multiple community blog posts** - Cross-verified against official docs

### Tertiary (LOW confidence)

- **Various Stack Overflow answers** - Used for edge case identification only, not for implementation guidance
- **Older blog posts (pre-2023)** - May contain outdated patterns, used only for historical context

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on official vite-plugin-pwa documentation and GitHub repository
- Architecture: HIGH - All patterns verified against official docs or widely-adopted community practices
- Pitfalls: HIGH - Most pitfalls documented in official docs or well-known in community

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - PWA ecosystem is stable but plugins may release updates)

**Key recommendations validated against:**
- vite-plugin-pwa GitHub repository (active, 2k+ stars)
- Vite official documentation (recommends vite-plugin-pwa)
- web.dev (Google's authoritative PWA resource)
- Multiple production PWA implementations
