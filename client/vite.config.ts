import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  
  build: {
    minify: 'esbuild',
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true
  },
  
  css: {
    postcss: './postcss.config.js',
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  }
})
