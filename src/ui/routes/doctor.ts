import { Router } from 'express';
import { doctorCommand } from '../../cli/commands/doctor';

const ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;

const router = Router();

router.get('/', async (_req, res) => {
  const lines: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  const origExit = process.exit;
  let ok = true;

  console.log = (...args: unknown[]) => lines.push(args.map(String).join(' ').replace(ANSI_ESCAPE, ''));
  console.error = (...args: unknown[]) => lines.push(args.map(String).join(' ').replace(ANSI_ESCAPE, ''));
  process.exit = (code?: number) => {
    ok = (code ?? 0) === 0;
    throw new Error(`exit:${code ?? 0}`);
  };

  try {
    await doctorCommand();
  } catch (e) {
    if (!(e instanceof Error) || !e.message.startsWith('exit:')) {
      lines.push(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  } finally {
    console.log = origLog;
    console.error = origError;
    process.exit = origExit;
  }

  res.json({ ok, lines });
});

export { router as doctorRouter };
