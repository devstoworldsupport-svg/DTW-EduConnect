import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'DTW EduConnect',
        short_name: 'EduConnect',
        description: 'Plataforma escolar inteligente desenvolvida pela DTW',
        theme_color: '#1E3A5F',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/firestore\.googleapis\.com\//, handler: 'NetworkFirst', options: { cacheName: 'firestore-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } } },
          { urlPattern: /^https:\/\/storage\.googleapis\.com\//, handler: 'CacheFirst', options: { cacheName: 'storage-cache', expiration: { maxEntries: 100, maxAgeSeconds: 604800 } } },
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\//, handler: 'CacheFirst', options: { cacheName: 'fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } } },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'charts': ['recharts'],
          'ai': ['@google/generative-ai'],
          'utils': ['date-fns', 'qrcode', 'jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
})
