import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { scheduleCommand } from '../../cli/commands/schedule';

const PLIST_LABEL = 'com.daily-summary';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);

function parsePlistTime(content: string): string | null {
  const hourMatch = /<key>Hour<\/key>\s*<integer>(\d+)<\/integer>/i.exec(content);
  const minuteMatch = /<key>Minute<\/key>\s*<integer>(\d+)<\/integer>/i.exec(content);
  if (!hourMatch || !minuteMatch) return null;
  const hour = parseInt(hourMatch[1], 10);
  const minute = parseInt(minuteMatch[1], 10);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getScheduleStatus() {
  if (process.platform !== 'darwin') {
    return { scheduled: false, time: null, loaded: false, platform: 'linux' as const };
  }
  if (!fs.existsSync(PLIST_PATH)) {
    return { scheduled: false, time: null, loaded: false, platform: 'macos' as const };
  }

  const content = fs.readFileSync(PLIST_PATH, 'utf8');
  const time = parsePlistTime(content);

  let loaded = false;
  try {
    const out = execSync(`launchctl list ${PLIST_LABEL} 2>/dev/null`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    loaded = out.trim().length > 0;
  } catch {
    loaded = false;
  }

  return { scheduled: true, time, loaded, platform: 'macos' as const };
}

const router = Router();

router.get('/', (_req, res) => {
  res.json(getScheduleStatus());
});

router.post('/', (req, res) => {
  const { time, remove } = req.body as { time?: string; remove?: boolean };

  const origExit = process.exit;
  process.exit = (code?: number) => { throw new Error(`exit:${code ?? 0}`); };

  try {
    scheduleCommand({ time: time ?? '08:00', remove });
    res.json({ ok: true, status: getScheduleStatus() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  } finally {
    process.exit = origExit;
  }
});

export { router as scheduleRouter };
