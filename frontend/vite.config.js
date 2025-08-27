import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Для локальной разработки
const localProxy = {
  target: 'http://localhost:5000',
  changeOrigin: true,
}

// Для Docker
const dockerProxy = {
  target: 'http://backend:5000',
  changeOrigin: true,
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': process.env.DOCKER ? dockerProxy : localProxy,
      '/WorkOST': process.env.DOCKER ? {  // Добавьте это
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/WorkOST/, '')  // Или оставьте как есть
      } : {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/WorkOST/, '')
      }
    }
  }
})
