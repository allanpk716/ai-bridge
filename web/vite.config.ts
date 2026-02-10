import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'AI-Bridge',
        short_name: 'AIBridge',
        description: 'Remote access to Claude Code CLI',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: false
      }
    }),
    visualizer({
      open: true,
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Increase chunk size warning threshold (default is 500)
    chunkSizeWarningLimit: 1000,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Target browser support (ES2015 = IE11+, modern browsers)
    target: 'es2015',

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Remove dead code
        dead_code: true
      }
    },

    // Rollup-specific options
    rollupOptions: {
      output: {
        manualChunks: {
          // React核心(稳定,缓存友好)
          'react-vendor': ['react', 'react-dom', 'react-router'],

          // UI库(大但稳定)
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
            'cmdk',
            'sonner'
          ],

          // 数据处理(中等大小)
          'data-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-query-devtools',
            'fuse.js',
            'zustand'
          ],

          // 实时通信(可能需要更新)
          'socket-vendor': ['socket.io-client'],

          // Markdown渲染(只在聊天时需要)
          'markdown-vendor': [
            'react-markdown',
            'remark-gfm',
            'react-syntax-highlighter',
            'streamdown'
          ],

          // 工具库(小但常用)
          'utils': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ]
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
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
