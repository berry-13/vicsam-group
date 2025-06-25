import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    minify: 'esbuild',
    target: 'es2020'
  },
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
