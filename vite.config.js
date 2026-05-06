import path from 'node:path'
import react from '@vitejs/plugin-react'
import base44 from '@base44/vite-plugin'
import { defineConfig } from 'vite'

const port = Number(process.env.PORT || 5173)

// Configuração de domínios (Registros A e CNAME)
const A_RECORDS = ['tocamais.app'] // Aponta para o IP da VPS
const CNAME_RECORDS = ['www.tocamais.app'] // Aponta para o domínio principal

const DOMAINS = [
  ...A_RECORDS,
  ...CNAME_RECORDS,
  '187.127.251.137',
  'localhost',
  '0.0.0.0'
]

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    allowedHosts: DOMAINS,
  },
  preview: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    allowedHosts: DOMAINS,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    base44(),
  ]
});
