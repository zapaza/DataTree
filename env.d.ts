/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare module 'vue-virtual-scroller';

declare module 'monaco-editor/esm/vs/editor/edcore.main.js' {
  export * from 'monaco-editor';
}

declare const __APP_VERSION__: string;
