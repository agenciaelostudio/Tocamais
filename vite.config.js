import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const port = Number(process.env.PORT || 5173)

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
  ]
});
