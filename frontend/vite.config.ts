import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    // TODO(TV4 — Tuần 8): thêm VitePWA({...}) từ 'vite-plugin-pwa' ở đây. Xem docs/ke-hoach/tuan-08.md
  ],
  server: {
    port: 5173,
    // Mọi request tới /api được chuyển sang backend → frontend và backend "chung địa chỉ", không lo lỗi CORS khi dev
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
