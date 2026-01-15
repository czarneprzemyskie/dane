import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a relative base so the build works when served from a custom domain or
// from GitHub Pages project pages (prevents absolute /src/... references).
export default defineConfig({
  base: './',
  plugins: [react()],
})
