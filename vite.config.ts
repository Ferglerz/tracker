/// <reference types="vitest/config" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

const rootDir = import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  resolve: {
    alias: {
      '@components': path.resolve(rootDir, './src/components'),
      '@pages': path.resolve(rootDir, './src/pages'),
      '@utils': path.resolve(rootDir, './src/utils'),
      '@assets': path.resolve(rootDir, './src/assets')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
