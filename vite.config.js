import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set base to repo name
  // Change 'tamil-learn' to your actual repo name if different
  base: process.env.GITHUB_ACTIONS ? '/tamil-learn/' : '/',
  server: {
    port: 3000,
    open: true
  }
})
