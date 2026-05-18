import express from 'express';
import path from 'path';
import { runRouter } from './routes/run';
import { reportsRouter } from './routes/reports';
import { configRouter } from './routes/config';
import { scheduleRouter } from './routes/schedule';
import { doctorRouter } from './routes/doctor';
import { mintlifyRouter } from './routes/mintlify';

export function createServer(): express.Application {
  const app = express();
  app.use(express.json());

  app.use('/api/run', runRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/config', configRouter);
  app.use('/api/schedule', scheduleRouter);
  app.use('/api/doctor', doctorRouter);
  app.use('/api/mintlify', mintlifyRouter);

  // After tsc, __dirname = dist/ui/ and the frontend builds to dist/ui/public/
  const staticDir = path.join(__dirname, 'public');
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  return app;
}
