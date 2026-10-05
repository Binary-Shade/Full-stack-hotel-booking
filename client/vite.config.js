import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // SECURITY: remove console.* and debugger from production builds
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))