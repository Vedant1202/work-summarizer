import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../config/loader';
import { listAllReports, getLastReportPath } from '../../report/exporter';

const router = Router();

router.get('/', (_req, res) => {
  const reports = listAllReports(loadConfig());
  res.json(reports);
});

// Must be defined before /:date so Express doesn't treat "by-path" as a date param
router.get('/by-path', (req, res) => {
  const encoded = req.query.b64;
  if (typeof encoded !== 'string') {
    res.status(400).json({ error: 'b64 query param required' });
    return;
  }
  let filePath: string;
  try {
    filePath = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    res.status(400).json({ error: 'invalid base64' });
    return;
  }
  if (!filePath.endsWith('.md') || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  const parts = path.basename(filePath).replace(/\.md$/, '').split('-');
  const date = parts.slice(0, 3).join('-');
  res.json({ date, filePath, content: fs.readFileSync(filePath, 'utf8') });
});

router.get('/:date', (req, res) => {
  const filePath = getLastReportPath(loadConfig(), req.params.date);
  if (!filePath) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  res.json({ date: req.params.date, filePath, content: fs.readFileSync(filePath, 'utf8') });
});

export { router as reportsRouter };
