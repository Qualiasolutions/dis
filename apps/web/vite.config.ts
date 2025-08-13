import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3000000, // 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes for real-time data
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'manifest.json'],
      manifest: {
        name: 'نظام طهبوب الذكي - Tahboub DIS',
        short_name: 'Tahboub DIS',
        description: 'نظام إدارة معارض السيارات بالذكاء الاصطناعي في الأردن',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '32x32',
            type: 'image/x-icon'
          },
          {
            src: 'favicon.ico',
            sizes: '192x192',
            type: 'image/x-icon'
          },
          {
            src: 'favicon.ico', 
            sizes: '512x512',
            type: 'image/x-icon'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI framework
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/form', '@mantine/notifications', '@mantine/modals'],
          // Backend & API
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          // Internationalization
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Charts and data visualization
          charts: ['recharts', 'date-fns'],
          // Performance optimization
          workers: ['comlink'],
          // State management
          state: ['zustand']
        }
      }
    },
    // Optimize for Jordan 3G networks
    chunkSizeWarningLimit: 1000,
  },
  // Web Worker support
  worker: {
    format: 'es',
    plugins: () => [react()]
  },
  // Optimization for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mantine/core',
      '@mantine/hooks',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'recharts',
      'comlink'
    ],
    exclude: ['@tanstack/react-query-devtools']
  }
})