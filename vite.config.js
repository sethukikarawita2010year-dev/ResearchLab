import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // The FastAPI backend writes PDFs and JSON state files inside the project
      // root (backend/uploads, backend/converted, backend/*.json). Letting Vite
      // watch those makes the dev server fire a full page reload mid-upload,
      // which wipes the in-flight chat. Keep the watcher scoped to the app.
      ignored: [
        '**/backend/**',
        '**/dist/**',
        '**/__pycache__/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
