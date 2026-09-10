import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@xyflow/react'],
    alias: {
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      '@xyflow/react': path.resolve(import.meta.dirname, 'node_modules/@xyflow/react'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
});
