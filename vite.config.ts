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
    {
      name: 'impactmesh-event-relay',
      configureServer(server) {
        const eventsHistory: any[] = [];
        const sseClients = new Set<any>();

        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];

          if (req.method === 'OPTIONS' && url?.startsWith('/api/')) {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            });
            res.end();
            return;
          }

          if (url === '/api/events/stream') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
            res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

            // Replay recent events to newly connected client
            for (const evt of eventsHistory.slice(-20)) {
              res.write(`data: ${JSON.stringify({ type: 'DECISION_EVENT', event: evt })}\n\n`);
            }

            sseClients.add(res);
            req.on('close', () => {
              sseClients.delete(res);
            });
            return;
          }

          if (url === '/api/events' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const event = data.event || data;
                if (event && event.id) {
                  eventsHistory.push(event);
                  if (eventsHistory.length > 500) eventsHistory.shift();

                  const msg = `data: ${JSON.stringify({ type: 'DECISION_EVENT', event })}\n\n`;
                  for (const client of sseClients) {
                    try {
                      client.write(msg);
                    } catch (_) {
                      sseClients.delete(client);
                    }
                  }
                }
                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify({ success: true, event }));
              } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
              }
            });
            return;
          }

          if (url === '/api/events' && req.method === 'GET') {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ success: true, events: eventsHistory }));
            return;
          }

          next();
        });
      },
    },
  ],
});
