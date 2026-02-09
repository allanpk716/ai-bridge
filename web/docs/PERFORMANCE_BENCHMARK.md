# Performance Benchmark Testing

This document provides a structured approach to performance testing and benchmarking for AI-Bridge web application.

## Test Environment Setup

### Chrome DevTools Configuration

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click the gear icon ⚙️ to open settings
4. Configure:
   - **Network**: Fast 3G
   - **CPU**: 4x slowdown
   - **Screen**: Desktop (1920x1080)

### Alternative: Lighthouse Configuration

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Configure:
   - **Device**: Desktop
   - **Throttling**: Simulated Fast 3G
   - **Categories**: Performance, Best Practices, Accessibility

## Performance Metrics & Targets

### Core Web Vitals

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **FCP** (First Contentful Paint) | < 2.0s | TBD | 🟡 |
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD | 🟡 |
| **FID** (First Input Delay) | < 100ms | TBD | 🟡 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD | 🟡 |
| **TTFB** (Time to First Byte) | < 600ms | TBD | 🟡 |

### Bundle Size Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Main bundle** (gzipped) | < 500KB | TBD | 🟡 |
| **react-vendor chunk** | < 100KB | TBD | 🟡 |
| **ui-vendor chunk** | < 150KB | TBD | 🟡 |
| **markdown-vendor chunk** | < 200KB | TBD | 🟡 |
| **Initial JS load** | < 1MB | TBD | 🟡 |

### Runtime Performance

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **SessionList render** | < 100ms | TBD | 🟡 |
| **ChatMessageList (1000 msgs)** | < 500ms | TBD | 🟡 |
| **StreamingMessage update** | < 50ms | TBD | 🟡 |
| **Route transition** | < 200ms | TBD | 🟡 |

## Testing Checklist

### 1. Bundle Size Verification

```bash
# Build production bundle
npm run build

# Analyze bundle
npm run analyze

# Check stats.html for:
# - Total bundle size
# - Chunk distribution
# - Largest dependencies
# - Tree-shaking effectiveness
```

**Acceptance Criteria:**
- [ ] Main bundle < 500KB (gzipped)
- [ ] No single chunk > 500KB
- [ ] Vendor chunks properly separated
- [ ] No duplicate dependencies

### 2. First Load Performance

**Steps:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Open DevTools > Network tab
3. Select "Fast 3G" throttling
4. Navigate to `http://localhost:3000`
5. Record metrics:
   - DOM Content Loaded
   - Load complete
   - Total transferred
   - Resources count

**Acceptance Criteria:**
- [ ] FCP < 2.0s
- [ ] Initial load < 5s on 3G
- [ ] Resource count < 50

### 3. Runtime Performance

**SessionList Render:**
```javascript
// Add to SessionList.tsx
useEffect(() => {
  const end = performance.mark('SessionList-render-start');
  return () => {
    performance.mark('SessionList-render-end');
    performance.measure('SessionList-render', 'SessionList-render-start', 'SessionList-render-end');
    const measure = performance.getEntriesByName('SessionList-render')[0];
    console.log(`SessionList render: ${measure.duration.toFixed(2)}ms`);
  };
});
```

**Acceptance Criteria:**
- [ ] Initial render < 100ms
- [ ] List scroll is smooth (60fps)
- [ ] No layout shifts

### 4. Lighthouse Score

**Steps:**
1. Build production: `npm run build`
2. Preview production: `npm run preview`
3. Open http://localhost:4173
4. Run Lighthouse audit
5. Record scores

**Acceptance Criteria:**
- [ ] Performance score > 90
- [ ] Best Practices > 90
- [ ] Accessibility > 90

### 5. Large Session Performance

**Test Scenario:**
1. Create session with 10,000 messages
2. Navigate to session detail
3. Scroll through messages
4. Send new message
5. Verify streaming updates

**Acceptance Criteria:**
- [ ] Initial load < 3s
- [ ] Scroll is smooth (Virtuoso working)
- [ ] New messages appear instantly
- [ ] No memory leaks (Chrome DevTools > Memory)

### 6. Code Splitting Verification

**Steps:**
1. Open DevTools > Network tab
2. Clear cache
3. Navigate to `/`
4. Observe loaded chunks
5. Navigate to `/sessions/:id`
6. Observe lazy-loaded chunks

**Acceptance Criteria:**
- [ ] Route components load on-demand
- [ ] Initial bundle doesn't include all routes
- [ ] Chunk files have reasonable sizes
- [ ] No duplicate code across chunks

## Performance Profiling Tools

### Chrome DevTools

**Performance Tab:**
- Record interactions
- Analyze flame graph
- Identify long tasks (> 50ms)
- Check render times

**Memory Tab:**
- Take heap snapshot
- Look for detached DOM nodes
- Check memory growth over time
- Identify memory leaks

**Network Tab:**
- Analyze resource loading
- Check transfer sizes
- Identify large resources
- Verify HTTP/2 multiplexing

### Custom Performance Monitoring

Use the `performance.ts` utilities:

```typescript
import { measureRender, measureOperation, logPerformanceMetric } from '@/lib/performance';

// Component render measurement
useEffect(() => {
  const endMeasure = measureRender('MyComponent');
  return endMeasure;
});

// Async operation measurement
const sessions = await measureOperation('fetchSessions', () =>
  api.getSessions()
);

// Custom metric
const marker = PerformanceMarker.start('custom-task');
// ... do work ...
marker.endWith({ itemsProcessed: 100 });
```

## Common Performance Issues

### 1. Large Bundle Size

**Symptoms:**
- Slow initial load
- High FCP/LCP

**Solutions:**
- Verify code splitting is working
- Check for duplicate dependencies
- Use bundle analyzer to find large modules
- Lazy load heavy components

### 2. Slow Render Performance

**Symptoms:**
- Janky scrolling
- Input lag
- Low FPS

**Solutions:**
- Use React.memo for expensive components
- Virtualize long lists (react-virtuoso)
- Debounce/throttle event handlers
- Avoid unnecessary re-renders

### 3. Memory Leaks

**Symptoms:**
- Memory grows over time
- App becomes sluggish
- Browser crashes eventually

**Solutions:**
- Cleanup event listeners in useEffect
- Close WebSocket connections
- Clear intervals/timeouts
- Check for detached DOM nodes

### 4. Network Waterfall Issues

**Symptoms:**
- Sequential resource loading
- Slow TTFB

**Solutions:**
- Use preload/prefetch hints
- Optimize critical CSS
- Minimize render-blocking resources
- Enable HTTP/2

## Regression Testing

Before each release:

```bash
# 1. Build production bundle
npm run build

# 2. Run Lighthouse CI
npx lighthouse http://localhost:4173 --view

# 3. Check bundle size
npm run analyze

# 4. Verify all metrics meet targets
# (See tables above)
```

## Performance Budgets

Consider using `webpack-bundle-analyzer` or `vite-plugin-compression` to enforce budgets:

```javascript
// vite.config.ts
{
  build: {
    rollupOptions: {
      output: {
        // Enforce chunk size limits
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}
```

## Continuous Monitoring

For production monitoring:

1. **Real User Monitoring (RUM)**
   - Add web-vitals library
   - Send metrics to analytics
   - Track Core Web Vitals over time

2. **Synthetic Monitoring**
   - Run Lighthouse CI in CI/CD
   - Test on real devices (BrowserStack)
   - Monitor bundle size in PRs

3. **Performance Budgets**
   - Set size limits in CI
   - Block PRs that exceed budgets
   - Alert on regressions

## Resources

- [Web.dev performance metrics](https://web.dev/performance/)
- [Vite performance optimization](https://vite.dev/guide/build.html)
- [React performance optimization](https://react.dev/reference/react/memo)
- [Chrome DevTools performance](https://developer.chrome.com/docs/devtools/performance/)
