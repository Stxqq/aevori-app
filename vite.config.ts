import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['framer-motion', 'motion'],
          markdown: ['react-markdown', 'remark-gfm'],
          primitives: [
            'radix-ui',
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
        },
      },
    },
  },
});
