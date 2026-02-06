# Stack Research

**Domain:** React PWA Frontend with TypeScript
**Researched:** 2025-02-06
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React** | 19.2.x | UI Framework | Latest stable with new features (Activity, useEffectEvent, cacheSignal), improved performance, better TypeScript integration, and production-ready since December 2024 |
| **Vite** | 5.4.x - 6.x | Build Tool | Lightning-fast HMR with native ESM, optimized production builds via Rollup, minimal configuration, excellent TypeScript support, and thriving plugin ecosystem |
| **TypeScript** | 5.7.x | Type Safety | Essential for catching bugs at compile time, superior developer experience with IntelliSense, and industry standard for React projects |

### PWA-Specific Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **vite-plugin-pwa** | 0.21.x | PWA Configuration | Zero-config PWA setup for Vite, integrates Workbox v7, generates manifest automatically, handles service worker registration, supports offline fallbacks |
| **Workbox** | 7.x (via plugin) | Service Worker | Google's battle-tested service worker library, intelligent caching strategies (NetworkFirst, StaleWhileRevalidate), precaching, runtime caching, background sync support |

### UI & Styling

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **Tailwind CSS** | 3.4.x | Utility-First CSS | Rapid development without leaving JSX, highly customizable, excellent mobile-first responsive utilities, small production bundle with JIT compiler |
| **shadcn/ui** | 2.9.x - 3.5.x | Component Library | Not a package but copy-paste components built on Radix UI + Tailwind, full ownership and customization, accessible components, TypeScript-first, modern design system |
| **Radix UI** | Latest (via shadcn) | Unstyled Components | Accessibility-first primitives, keyboard navigation, screen reader support, comprehensive component library |

### State Management & Data Fetching

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **TanStack Query** | 5.84.x | Server State | Automatic caching, background refetching, request deduplication, optimistic updates, React Suspense support, handles loading/error states, type-safe with TypeScript |
| **Zod** | 3.24.x | Schema Validation | TypeScript-first validation, static type inference, runtime type checking, perfect for API response validation, integrates with TanStack Query |

### Real-Time Communication

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **socket.io-client** | 4.8.x | WebSocket Client | Automatic reconnection, fallback to polling, event-based communication, rooms/namespace support, works with AI-Bridge Go backend Socket.IO server |

### Routing

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **React Router** | 7.9.x | Client-Side Routing | Latest version supports React 19, type-safe routing, nested routes, code splitting, built-in data loading, compatible with PWA navigation patterns |

### HTTP Client

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **axios** | 1.7.x | HTTP Requests | Promise-based API, request/response interceptors, automatic JSON transformation, request cancellation, better error handling than fetch, TypeScript support |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **@vitejs/plugin-react** | React support for Vite | Fast HMR with React Fast Refresh, JSX/TSX support, React Compiler integration coming |
| **ESLint** | Linting | Use with eslint-plugin-react-hooks v6 for new React 19 rules |
| **Prettier** | Code Formatting | Consistent code style, integrates with ESLint |
| **Vitest** | Unit Testing | Native Vite integration, fast test runs, Jest-compatible API |
| **React Testing Library** | Component Testing | Test user behavior, not implementation details, PWA-friendly |

## Installation

```bash
# Create Vite + React + TypeScript project
npm create vite@latest ai-bridge-web -- --template react-ts
cd ai-bridge-web

# Core dependencies
npm install react@19.2 react-dom@19.2
npm install react-router@7.9
npm install @tanstack/react-query@5.84
npm install socket.io-client@4.8
npm install axios@1.7
npm install zod@3.24

# UI & Styling
npm install -D tailwindcss@3.4 postcss autoprefixer
npx tailwindcss init -p
npm install -D @types/node

# shadcn/ui (interactive CLI)
npx shadcn@latest init

# PWA support
npm install -D vite-plugin-pwa@0.21

# Dev dependencies
npm install -D @vitejs/plugin-react
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

## Configuration Files

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'AI-Bridge Web',
        short_name: 'AI-Bridge',
        description: 'PWA frontend for AI-Bridge backend',
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
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
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

### tsconfig.json (add path aliases)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client", "vite-plugin-pwa/client"]
  }
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### components.json (for shadcn/ui)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vite** | Webpack, CRA | Legacy projects requiring complex webpack customization (not recommended for new projects) |
| **React 19** | React 18 | If third-party libraries haven't updated yet (temporary migration period) |
| **TanStack Query** | SWR, Apollo Client | SWR if you want lighter weight, Apollo if using GraphQL exclusively |
| **shadcn/ui** | MUI, Chakra UI | If you need pre-built styled components quickly and don't care about customization control |
| **Tailwind CSS** | CSS Modules, Styled Components | If you prefer CSS-in-JS or traditional CSS files over utility classes |
| **vite-plugin-pwa** | next-pwa, @angular/pwa | Only if using Next.js or Angular frameworks |
| **socket.io-client** | native WebSocket, SockJS | Native WebSocket if backend doesn't use Socket.IO, SockJS for older browser support |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App (CRA)** | Deprecated, no longer maintained, slow builds, outdated webpack configuration | Vite with React template |
| **React Router v5/v6** | Older versions not optimized for React 19, missing type-safe routing features | React Router v7.9+ |
| **Redux** | Overkill for most apps, complex boilerplate, TanStack Query handles server state better | TanStack Query + React Context for client state |
| **Styled Components** | Runtime overhead, larger bundle size, slower than Tailwind | Tailwind CSS + shadcn/ui |
| **Class Components** | Obsolete since React 16.8 (2019), no hooks support | Functional Components with Hooks |
| **PropTypes** | Redundant with TypeScript, runtime-only | TypeScript + Zod for runtime validation |
| **Fetch API directly** | No interceptors, no caching, verbose error handling | Axios or TanStack Query's fetch wrapper |
| **Custom service worker** | Complex to implement correctly, hard to maintain, caching strategies are error-prone | Workbox via vite-plugin-pwa |
| **Jest** | Slow with Vite, requires complex configuration | Vitest (drop-in Jest replacement for Vite) |
| **Enzyme** | Deprecated, encourages implementation testing | React Testing Library |

## Stack Patterns by Variant

**If building MVP quickly:**
- Use shadcn/ui pre-built components without customization
- Skip custom service worker (use vite-plugin-pwa defaults)
- Use TanStack Query's default options
- Defer advanced PWA features (push notifications, background sync)

**If prioritizing performance:**
- Enable React Compiler when available in Vite
- Use code splitting with React Router lazy routes
- Configure aggressive caching strategies in Workbox
- Use TanStack Query's prefetching and cache management
- Optimize images with vite-plugin-image-optimizer

**If building enterprise app:**
- Add Zod validation for all API requests
- Implement comprehensive error boundaries
- Use React Suspense with TanStack Query
- Add comprehensive logging (e.g., Sentry)
- Implement feature flags
- Add E2E testing with Playwright

**If targeting mobile-first:**
- Prioritize touch-friendly shadcn/ui components
- Use mobile-optimized Tailwind breakpoints
- Test service worker offline mode extensively
- Add app shortcuts in manifest
- Implement install prompt at optimal time
- Test on real devices (Lighthouse mobile audit)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.2.x | Vite 5.4+, 6.x | Vite 6 has React 19 optimizations |
| React 19.2.x | React Router 7.5+ | Router v7 required for React 19 |
| TanStack Query 5.84.x | React 18+, 19 | Full React 19 support |
| socket.io-client 4.8.x | Socket.IO server 2.0-4.0+ | Must match backend server major version |
| vite-plugin-pwa 0.21.x | Vite 5+, Node 18+ | Requires Node 18+ for Workbox v7 |
| Tailwind CSS 3.4.x | Any framework | Framework-agnostic |
| shadcn/ui 3.5.x | React 18+, 19 | Requires Radix UI dependencies |
| Zod 3.24.x | TypeScript 4.7+ | TS 4.7 required for type inference |
| Vitest 2.x | Vite 5+, 6.x | Version aligned with Vite |

## PWA Best Practices Configuration

### Service Worker Strategy
- **Development**: Enable with `devOptions.enabled: true` for testing
- **Production**: Use `registerType: 'autoUpdate'` for seamless updates
- **Caching**:
  - Static assets: `CacheFirst` (CSS, JS, images)
  - API calls: `NetworkFirst` with 1-hour expiration
  - HTML fallback: Custom offline page
- **Update Prompt**: Use `useRegisterSW` hook from `virtual:pwa-register/react`

### Manifest Requirements
- **Required fields**: name, short_name, start_url, display, icons (192px, 512px)
- **Recommended**: theme_color, background_color, description, categories
- **Icons**: Include maskable icon for adaptive icons on Android
- **Display mode**: Use `standalone` for app-like experience

### Performance Targets
- **Lighthouse Score**: 90+ across all categories
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Install rate**: Target 5%+ of visitors
- **Offline support**: Top 3 user journeys must work offline

### Mobile Considerations
- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- **Safe areas**: Support `env(safe-area-inset-*)` for notched devices
- **Touch targets**: Minimum 44x44px for buttons (WCAG 2.1)
- **Install prompt**: Trigger after 3+ visits or user engagement
- **Splash screen**: Configure via manifest theme_color + icons

## Key Integration Points with AI-Bridge Backend

### REST API Integration
```typescript
// Use TanStack Query for API calls
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000
})

// Sessions
export const useSessions = () => useQuery({
  queryKey: ['sessions'],
  queryFn: () => apiClient.get('/api/v1/sessions').then(r => r.data)
})

// Messages with pagination
export const useMessages = (sessionId: string, since?: number) => useQuery({
  queryKey: ['messages', sessionId, since],
  queryFn: () => apiClient.get(`/api/v1/sessions/${sessionId}/messages`, {
    params: { since, limit: 50 }
  }).then(r => r.data)
})
```

### Socket.IO Integration
```typescript
// Socket.IO hook for real-time updates
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (sessionId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080', {
      transports: ['websocket'],
      query: { sessionId }
    })

    socketInstance.on('connect', () => {
      console.log('Connected to AI-Bridge')
    })

    socketInstance.on('message', (message) => {
      // Handle real-time message
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [sessionId])

  return socket
}
```

### TypeScript Types for Backend
```typescript
// types/api.ts (based on HAPI protocol)
export interface Session {
  id: string
  status: 'active' | 'idle' | 'stopped'
  createdAt: string
  metadata: Record<string, unknown>
}

export interface Message {
  seq: number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  type?: 'text' | 'tool_use' | 'permission'
}

export interface PermissionRequest {
  id: string
  type: string
  description: string
  createdAt: string
}

// Zod schemas
import { z } from 'zod'

export const messageSchema = z.object({
  seq: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  type: z.enum(['text', 'tool_use', 'permission']).optional()
})
```

## Sources

### High Confidence (Context7 + Official Docs)
- /facebook/react (v19.2.0) — React 19 latest features, stability status, production readiness
- /vitejs/vite (v5.4.21, v7.0.0) — Vite configuration, TypeScript setup, React plugin
- /vite-pwa/vite-plugin-pwa — PWA plugin configuration, Workbox integration, service worker setup
- /tanstack/query (v5.84.1) — TanStack Query React integration, TypeScript support
- /websites/socket_io_v4_client-api — Socket.IO client API, React integration patterns
- /websites/ui_shadcn — shadcn/ui installation, Vite configuration, component system
- /websites/v3_tailwindcss — Tailwind CSS v3.4, Vite integration guide

### Medium Confidence (WebSearch + Verification)
- React 19 official blog (2025-10-01) — React 19.2 features, new hooks, performance improvements
- MDN Web Docs — PWA best practices, service worker patterns, offline strategies
- vite-plugin-pwa documentation (netlify.app) — Advanced PWA configuration, caching strategies
- Progressive Web Apps Guide 2025 (isitdev.com) — Current PWA standards, 2025 best practices
- React PWA tutorials (codezup.com, overcode.tech) — Implementation patterns, common pitfalls

### Low Confidence (Single Source - Needs Validation)
- Vite 7 roadmap mentions — Planned features, not yet released
- React Compiler Vite plugin — Referenced in articles but not generally available

---

*Stack research for: AI-Bridge-Web PWA Frontend*
*Researched: 2025-02-06*
