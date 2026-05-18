import { Router } from 'express';
import { loadConfig, maskConfig, saveConfig } from '../../config/loader';
import type { ConfigScope } from '../../config/types';

const router = Router();

router.get('/', (_req, res) => {
  res.json(maskConfig(loadConfig()));
});

router.post('/', (req, res) => {
  const { key, value, scope } = req.body as { key: string; value: string; scope?: ConfigScope };
  if (!key || value === undefined) {
    res.status(400).json({ error: 'key and value are required' });
    return;
  }
  saveConfig(scope === 'global' ? 'global' : 'local', key, String(value));
  res.json({ ok: true });
});

export { router as configRouter };
