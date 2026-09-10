import http from 'node:http';
import { handleApiRequest } from './api.ts';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const server = http.createServer((req, res) => {
  handleApiRequest(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`FlowTrace backend API running at http://localhost:${PORT}/api`);
});
