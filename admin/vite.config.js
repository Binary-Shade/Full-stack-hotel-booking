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
  server: {
    port: 5174, // client uses 5173
    // SE4030 SECURITY FIX - Z3; Detection: OWASP ZAP.
    // Original: implicit Vite CORS defaults permitted wildcard asset reads.
    cors: false,
    // SE4030 SECURITY FIX - Z2: no original Vite CSP header was configured.
    headers: {
      // SE4030 SECURITY FIX - Z4
      // Vulnerability: Missing Anti-clickjacking Header; Detection: OWASP ZAP.
      // Original: no X-Frame-Options header. Z2 already added frame-ancestors.
      // Fix: DENY provides a fallback consistent with frame-ancestors 'none'.
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': frontendCsp({
        application: 'admin', development: true, reactPreamble: react.preambleCode,
      }),
    },
    // Same-origin proxy so the httpOnly auth cookie is stored and sent.
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    cors: false, // Z3: assets are also same-origin in preview.
    headers: {
      'X-Frame-Options': 'DENY', // Z4: same embedding restriction in preview.
      'Content-Security-Policy': frontendCsp({ application: 'admin' }),
    },
  },
}))
