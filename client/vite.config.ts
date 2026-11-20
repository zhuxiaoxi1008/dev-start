import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// 如果你用的是 Tailwind CSS v4，需要安装 @tailwindcss/vite
// pnpm add -D @tailwindcss/vite
// import tailwindcss from "@tailwindcss/vite" 

export default defineConfig({
  plugins: [
    react(),
    // tailwindcss() // 如果你没装 @tailwindcss/vite 就不要写这个
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    },
    open: true,
  }
})