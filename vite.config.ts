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
  },
  plugins: [
    vue(),
    vueDevTools(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'mask-icon.svg'],
      manifest: {
        name: 'DataTree - Local API Payload Inspector',
        short_name: 'DataTree',
        description: 'Local API payload inspector for JSON and XML: inspect, validate, compare, and transform data in your browser.',
        id: '/',
        start_url: '/',
        scope: '/',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        categories: ['developer', 'productivity', 'utilities'],
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
        ],
        screenshots: [
          {
            src: 'd08d4c58df1545545114323379e35313_1767894518.png',
            sizes: '1024x1024',
            type: 'image/png',
            label: 'DataTree Inspect mode with local payload tree'
          },
          {
            src: 'screenshots/transform-mode.png',
            sizes: '3600x2088',
            type: 'image/png',
            form_factor: 'wide',
            label: 'DataTree Transform mode'
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
        manualChunks(id) {
          if (id.includes('node_modules/monaco-editor')) return 'monaco-editor';
          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia')) return 'vendor';
          if (
            id.includes('node_modules/jsonc-parser') ||
            id.includes('node_modules/fast-xml-parser') ||
            id.includes('node_modules/zod') ||
            id.includes('node_modules/ajv') ||
            id.includes('node_modules/ajv-formats')
          ) {
            return 'parser-tools';
          }
        },
      },
    },
  },
})
