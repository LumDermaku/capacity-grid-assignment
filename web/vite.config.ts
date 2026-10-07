/// <reference types="vitest/config" />
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // The React Router plugin doesn't run under Vitest.
  plugins: [!process.env.VITEST && reactRouter()],
  server: {
    port: 3000,
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    setupFiles: ['./app/test-setup.ts'],
  },
})
