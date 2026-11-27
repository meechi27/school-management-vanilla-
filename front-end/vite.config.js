import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./js', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};
