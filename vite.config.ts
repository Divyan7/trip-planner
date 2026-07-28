import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  define: {
    // In production, VITE_API_URL is set to the Render backend URL.
    // In dev, the Vite proxy above handles /api → localhost:8787.
    __API_BASE__: JSON.stringify(
      mode === 'production' ? (process.env.VITE_API_URL ?? '') : ''
    ),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
