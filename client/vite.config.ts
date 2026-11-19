import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // 本地联调时将 /api 代理到 Hono 后端
        changeOrigin: true
      }
    },
    open: true,
  }
})