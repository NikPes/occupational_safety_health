import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const localProxy = {
  target: 'http://localhost:5000',
  changeOrigin: true,
}

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
      '/WorkOST': process.env.DOCKER ? dockerProxy : localProxy,
    }
  }
})