import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json'

// Some dependencies (notably @vitejs/plugin-vue in newer versions) rely on
// `globalThis.crypto.hash(...)`. Ensure it's available in Node environments.
type THashableCrypto = {
  hash?: (algorithm: string, data: Uint8Array) => Buffer
}

const g = globalThis as unknown as { crypto?: THashableCrypto }
if (!g.crypto) g.crypto = {}
if (typeof g.crypto.hash !== 'function') {
  g.crypto.hash = (algorithm: string, data: Uint8Array) => createHash(algorithm).update(data).digest()
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_STAGE__: JSON.stringify('alpha'),
  },
  plugins: [
    vue(),
    vueDevTools(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'DataTree - Professional JSON/XML Visualizer',
        short_name: 'DataTree',
        description: 'Professional tool for visualization, analysis, and conversion of JSON and XML structures.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'editor': ['jsonc-parser', 'fast-xml-parser', 'zod'],
          'tree': [],
        },
      },
    },
  },
})
