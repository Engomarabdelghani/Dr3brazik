import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local development: the Node API (server/, npm run dev) answers /api on port 4000.
    // Same origin through the proxy, so the admin refresh cookie needs no CORS setup.
    proxy: {
      '/api': 'http://localhost:4000',
      // Product and site images stored on the API server.
      '/uploads': 'http://localhost:4000',
    },
  },
})
