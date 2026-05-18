import { Router } from 'express';
import { loadConfig } from '../../config/loader';
import { MintlifyDeployClient } from '../../integrations/mintlify/deploy';
import { appendDeployRecord, listDeployRecords, filterRecordsSince } from '../../integrations/mintlify/cache';
import { MintlifyDeployMode, MintlifyStatusResponse } from '../../integrations/mintlify/types';
import { GeminiProvider } from '../../llm/gemini';
import { buildDeploymentSummaryPrompt } from '../../llm/prompts';

const router = Router();

router.get('/history', (_req, res) => {
  res.json(listDeployRecords(50));
});

router.get('/status/:statusId', async (req, res) => {
  const config = loadConfig();
  const apiKey = config.integrations?.mintlify?.apiKey;
  const projectId = config.integrations?.mintlify?.projectId ?? 'unknown';

  if (!apiKey) {
    res.status(400).json({ error: 'MINTLIFY_API_KEY is not configured. Set it via: daily-summary config set integrations.mintlify.apiKey <key>' });
    return;
  }

  try {
    const client = new MintlifyDeployClient(apiKey, projectId);
    const status = await client.getStatus(req.params.statusId);
    res.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

router.post('/trigger', async (req, res) => {
  const { mode, branch } = req.body as { mode?: string; branch?: string };
  const config = loadConfig();

  const apiKey = config.integrations?.mintlify?.apiKey;
  const projectId = config.integrations?.mintlify?.projectId;

  if (!apiKey || !projectId) {
    res.status(400).json({ error: 'Mintlify API key and project ID must be configured. Run: daily-summary config set integrations.mintlify.apiKey <key>' });
    return;
  }

  const deployMode: MintlifyDeployMode = mode === 'production' ? 'production' : 'preview';

  if (deployMode === 'preview' && !branch) {
    res.status(400).json({ error: 'branch is required for preview deployments' });
    return;
  }

  const client = new MintlifyDeployClient(apiKey, projectId);

  try {
    let statusId: string;
    let previewUrl: string | undefined;

    if (deployMode === 'preview') {
      const result = await client.triggerPreview(branch!);
      statusId = result.statusId;
      previewUrl = result.previewUrl;
    } else {
      const result = await client.triggerProduction();
      statusId = result.statusId;
    }

    res.json({ statusId, previewUrl });

    // Poll in background and cache the final record
    void (async () => {
      try {
        let finalStatus: MintlifyStatusResponse | undefined;
        while (true) {
          await new Promise<void>((r) => setTimeout(r, 4000));
          const status = await client.getStatus(statusId);
          if (status.status === 'success' || status.status === 'failure') {
            finalStatus = status;
            break;
          }
        }
        const record = client.buildDeployRecord(statusId, deployMode, finalStatus!, { branch, previewUrl });
        appendDeployRecord(record);
      } catch {
        // best-effort — don't surface background errors
      }
    })();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

router.post('/summary', async (req, res) => {
  const { since } = req.body as { since?: string };
  const config = loadConfig();

  if (!config.llm.apiKey || !config.llm.model) {
    res.status(400).json({ error: 'GEMINI_API_KEY and GEMINI_MODEL must be configured. Run: daily-summary config init' });
    return;
  }

  const all = listDeployRecords();
  const records = filterRecordsSince(all, since ?? '7d');

  if (records.length === 0) {
    res.json({ summary: `No Mintlify deployments found in the last ${since ?? '7d'}.` });
    return;
  }

  try {
    const provider = new GeminiProvider(config.llm.apiKey, config.llm.model);
    const prompt = buildDeploymentSummaryPrompt(records);
    const summary = await provider.rawPrompt(prompt);
    res.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export { router as mintlifyRouter };
