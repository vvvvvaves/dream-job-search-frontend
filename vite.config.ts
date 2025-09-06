import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Allow popups to communicate with opener window for OAuth flow
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Keep other security headers
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
})
