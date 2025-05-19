import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: {
      // Fix for production deployment
      host: 'landivo.com',
      clientPort: 443, // HTTPS port
      protocol: 'wss'
    }
  }
})
