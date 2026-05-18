import { Router } from 'express';
import { runCommand } from '../../cli/commands/run';

interface RunState {
  running: boolean;
  lastRunDate: string | null;
  error: string | null;
}

interface RunRequestBody {
  since?: string;
  branch?: string;
  repo?: string;
  length?: string;
  format?: string;
  withLinear?: boolean;
}

const state: RunState = { running: false, lastRunDate: null, error: null };

const router = Router();

router.get('/status', (_req, res) => {
  res.json(state);
});

router.post('/', (req, res) => {
  if (state.running) {
    res.status(409).json({ error: 'A run is already in progress' });
    return;
  }

  const { since, branch, repo, length, format, withLinear } = req.body as RunRequestBody;

  state.running = true;
  state.error = null;
  res.json({ started: true });

  const origExit = process.exit;
  process.exit = (code?: number) => { throw new Error(`exit:${code ?? 0}`); };

  void runCommand({
    since: since ?? '24h',
    branch,
    repo,
    length,
    format,
    edit: false,
    withLinear: withLinear === true,
  })
    .then(() => {
      state.lastRunDate = new Date().toISOString();
    })
    .catch((err: unknown) => {
      state.error = err instanceof Error ? err.message : String(err);
    })
    .finally(() => {
      state.running = false;
      process.exit = origExit;
    });
});

export { router as runRouter };
