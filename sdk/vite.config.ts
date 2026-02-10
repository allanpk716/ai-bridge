import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'AIBridgeSDK',
      fileName: (format) => `ai-bridge-sdk.${format === 'es' ? 'es' : 'umd.cjs'}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        globals: {
          zod: 'Zod'
        }
      },
      external: ['zod']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
