import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy de développement : le front appelle /api/... sans CORS (Flask tourne sur le port 5000)
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:5000', '/static': 'http://127.0.0.1:5000' } },
})
