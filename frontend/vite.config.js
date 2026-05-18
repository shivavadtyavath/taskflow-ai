import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    allowedHosts: ['taskflow-ai-frontend.onrender.com', 'all'],
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 1500,
  }
})
