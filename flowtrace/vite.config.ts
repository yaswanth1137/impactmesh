import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './server/api.ts';

const apiPlugin = (): Plugin => ({
  name: 'flowtrace-api-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        handleApiRequest(req, res, next);
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiPlugin()
  ],
  server: {
    watch: {
      ignored: ['**/data/**', '**/data/uploads/**', '**/*.json', '**/*.csv', '**/*.txt']
    }
  }
});
