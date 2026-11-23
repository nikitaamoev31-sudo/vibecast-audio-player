import { defineConfig } from 'vite';

// Бэкенд не отдаёт CORS-заголовки, поэтому в разработке
// запросы к /api проксируются на express-сервер.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
