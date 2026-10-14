import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
// A file URL uses /D:/... on Windows; Vite aliases need D:/... instead.
const nativePwaModule = decodeURIComponent(new URL('./src/lib/native-pwa.ts', import.meta.url).pathname)
  .replace(/^\/([A-Za-z]:\/)/, '$1');

export default defineConfig(({ mode }) => ({
  build: { outDir: mode === 'android' ? 'dist-android' : 'dist' },
  resolve: mode === 'android' ? { alias: {
    'virtual:pwa-register/react': nativePwaModule,
  } } : {},
  plugins: [react(), tailwindcss(), ...(mode === 'android' ? [] : [VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'icons/*.png'],
    manifest: {
      id: '/', name: '47天国考冲刺管理系统', short_name: '47天冲刺',
      description: '个人备考与健康记录', lang: 'zh-CN', start_url: '/', scope: '/',
      display: 'standalone', background_color: '#f6f8fc', theme_color: '#2563eb',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
  })])],
}));
