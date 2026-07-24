import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.FRONTEND_HOST || process.env.HOST || '127.0.0.1',
    port: Number(process.env.FRONTEND_PORT || 3000),
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || 4101}`,
        changeOrigin: true,
      },
    },
  },
});
