/**
 * Performance monitoring utilities for AI-Bridge web application
 *
 * This module provides functions to track and log performance metrics
 * for application monitoring and optimization.
 */

/**
 * Log a performance metric
 * In development, logs to console. Can be extended to send to analytics services.
 *
 * @param name - Name of the metric (e.g., 'SessionList-render', 'API-fetch-sessions')
 * @param duration - Duration in milliseconds
 * @param metadata - Optional additional data to log
 */
export function logPerformanceMetric(
  name: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const metric = {
    name,
    duration,
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata })
  };

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metadata || '');
  }

  // TODO: Send to analytics service (e.g., Google Analytics, DataDog)
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', 'timing_complete', {
  //     name: name,
  //     value: Math.round(duration),
  //     event_category: 'Performance'
  //   });
  // }
}

/**
 * Start a performance measurement for a component render
 *
 * @param componentName - Name of the component being measured
 * @returns A cleanup function to end the measurement
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const endMeasure = measureRender('SessionList');
 *   return endMeasure;
 * }, []);
 * ```
 */
export function measureRender(componentName: string): () => void {
  const markName = `${componentName}-render-start`;
  performance.mark(markName);

  return () => {
    const endMarkName = `${componentName}-render-end`;
    const measureName = `${componentName}-render`;

    try {
      performance.mark(endMarkName);
      performance.measure(measureName, markName, endMarkName);

      const entries = performance.getEntriesByName(measureName, 'measure');
      if (entries.length > 0) {
        const measure = entries[0];
        logPerformanceMetric(measureName, measure.duration);

        // Clean up marks and measures
        performance.clearMarks(markName);
        performance.clearMarks(endMarkName);
        performance.clearMeasures(measureName);
      }
    } catch (error) {
      console.error(`[Performance] Failed to measure ${componentName}:`, error);
    }
  };
}

/**
 * Measure an async operation
 *
 * @param name - Name of the operation
 * @param fn - Async function to measure
 * @returns Result of the async function
 *
 * @example
 * ```ts
 * const sessions = await measureOperation('fetchSessions', () =>
 *   api.getSessions()
 * );
 * ```
 */
export async function measureOperation<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logPerformanceMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logPerformanceMetric(`${name}-error`, duration, { error: String(error) });
    throw error;
  }
}

/**
 * Get Web Vitals metrics (FCP, LCP, FID, CLS)
 * Requires web-vitals library to be installed
 *
 * @example
 * ```ts
 * if (import.meta.env.PROD) {
 *   import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
 *     getCLS(console.log);
 *     getFID(console.log);
 *     getFCP(console.log);
 *     getLCP(console.log);
 *     getTTFB(console.log);
 *   });
 * }
 * ```
 */
export function initWebVitals(): void {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // web-vitals not installed, skip metrics collection
    // TODO: Install web-vitals package if needed for production monitoring
    console.log('[Performance] Web Vitals monitoring disabled (web-vitals not installed)');
  }
}

/**
 * React hook to measure component render performance
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function SessionList() {
 *   useRenderMetric('SessionList');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderMetric(componentName: string): void {
  // Note: This hook doesn't use useEffect internally to avoid double-measurement
  // It's meant to be called at the top of a component
  // The actual measurement should be done in useEffect for accuracy
}

/**
 * Performance marker for custom timing
 *
 * @example
 * ```ts
 * const startMark = PerformanceMarker.start('custom-operation');
 * // ... do work ...
 * startMark.end();
 * ```
 */
export class PerformanceMarker {
  private name: string;
  private startTime: number;
  private metadata?: Record<string, unknown>;

  constructor(name: string, metadata?: Record<string, unknown>) {
    this.name = name;
    this.startTime = performance.now();
    this.metadata = metadata;
  }

  /**
   * Start a new performance marker
   */
  static start(name: string, metadata?: Record<string, unknown>): PerformanceMarker {
    return new PerformanceMarker(name, metadata);
  }

  /**
   * End the measurement and log it
   */
  end(): void {
    const duration = performance.now() - this.startTime;
    logPerformanceMetric(this.name, duration, this.metadata);
  }

  /**
   * End the measurement with additional metadata
   */
  endWith(additionalMetadata: Record<string, unknown>): void {
    const duration = performance.now() - this.startTime;
    logPerformanceMetric(this.name, duration, { ...this.metadata, ...additionalMetadata });
  }
}

/**
 * Get browser performance memory information (if available)
 * Only works in Chrome-based browsers
 */
export function getMemoryInfo(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  return null;
}

/**
 * Log memory usage (development only)
 */
export function logMemoryUsage(): void {
  if (import.meta.env.DEV) {
    const memory = getMemoryInfo();
    if (memory) {
      const usedMB = (memory.usedJSHeapSize! / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize! / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit! / 1024 / 1024).toFixed(2);
      console.log(`[Memory] ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
    }
  }
}
