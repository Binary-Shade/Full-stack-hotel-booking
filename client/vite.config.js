import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { frontendCsp } from '../security/frontendCsp.mjs'
import { noSniffHeaders } from '../security/noSniffHeaders.mjs'

export default defineConfig(({ mode }) => ({
  // SE4030 SECURITY FIX - Z6: nosniff covers assets and early/error responses.
  plugins: [noSniffHeaders(), react()],
  // SECURITY: remove console.* and debugger from production builds
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  // SE4030 SECURITY FIX - Z2: OWASP ZAP reported no CSP on Vite HTML.
  // No original header configuration existed; keep dev and preview covered.
  server: {
    // Send API requests to Express instead of Vite's HTML fallback.
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
    // SE4030 SECURITY FIX - Z3; Detection: OWASP ZAP.
    // Original: implicit Vite CORS defaults. Assets require only same-origin use.
    cors: false,
    headers: {
      // SE4030 SECURITY FIX - Z4
      // Vulnerability: Missing Anti-clickjacking Header; Detection: OWASP ZAP.
      // Original: no X-Frame-Options header. Z2 already added frame-ancestors.
      // Fix: DENY provides a fallback consistent with frame-ancestors 'none'.
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': frontendCsp({
        application: 'client', development: true, reactPreamble: react.preambleCode,
      }),
    },
  },
  preview: {
    cors: false, // Z3: also disable cross-origin asset reads in preview.
    headers: {
      'X-Frame-Options': 'DENY', // Z4: same embedding restriction in preview.
      'Content-Security-Policy': frontendCsp({ application: 'client' }),
    },
  },
}))
