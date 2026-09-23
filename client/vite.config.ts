import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    proxy: {
      '/api/auth': { target: 'http://127.0.0.1:4000', rewrite: path => path.replace(/^\/api\/auth/, '') },
      '/api/ai': { target: 'http://127.0.0.1:5455', ws: true, rewrite: path => path.replace(/^\/api\/ai/, '') },
    },
  },
  plugins: [react(), tailwindcss()],
})
