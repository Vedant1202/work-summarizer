import http from 'http';
import { createServer } from '../../ui/server';

const PORT = 7331;

export async function uiCommand(): Promise<void> {
  const app = createServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, () => {
      const url = `http://localhost:${PORT}`;
      console.log(`\nwork-summary UI  →  ${url}\n`);
      void import('open').then(({ default: open }) => open(url)).catch(() => {
        console.log(`Open your browser to: ${url}`);
      });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Is the UI already running?`);
      }
      reject(err);
    });

    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      server.close(() => resolve());
    });
  });
}
