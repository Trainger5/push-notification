import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/sdk.js': { target: 'http://localhost:4000', changeOrigin: true },
      '/pn-sw.js': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    // Production optimizations
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
    // Reduce bundle size
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 5173,
  },
})
