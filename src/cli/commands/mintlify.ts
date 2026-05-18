import { execSync } from 'child_process';
import { Command } from 'commander';
import { loadConfig } from '../../config/loader';
import { MintlifyDeployClient } from '../../integrations/mintlify/deploy';
import { appendDeployRecord, listDeployRecords } from '../../integrations/mintlify/cache';
import { MintlifyStatusResponse } from '../../integrations/mintlify/types';
import os from 'os';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function pass(label: string, detail: string): void {
  console.log(`  ${GREEN}✓${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

function fail(label: string, detail: string): void {
  console.log(`  ${RED}✗${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

function skip(label: string, detail: string): void {
  console.log(`  ${DIM}-${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

function currentBranchName(repoPath: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function formatElapsed(startMs: number): string {
  const totalSec = Math.floor((Date.now() - startMs) / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function shortenPath(p: string): string {
  return p.replace(os.homedir(), '~');
}

export function mintlifyCommand(): Command {
  const cmd = new Command('mintlify').description('Mintlify deployment commands');

  // ── trigger ──────────────────────────────────────────────────────────────────
  cmd
    .command('trigger')
    .description('Trigger a Mintlify documentation deployment')
    .option('--production', 'deploy to the live site (default: preview)')
    .option('--branch <name>', 'branch name for preview deployment')
    .option('--project-id <id>', 'Mintlify project ID (overrides config and MINTLIFY_PROJECT_ID)')
    .option('--no-poll', 'fire-and-forget: print statusId and exit without waiting')
    .action(async (options) => {
      const config = loadConfig();

      const apiKey = config.integrations?.mintlify?.apiKey;
      if (!apiKey) {
        console.error('Error: MINTLIFY_API_KEY is not set.');
        console.error('  export MINTLIFY_API_KEY=mint_...');
        console.error('  or: daily-summary config set integrations.mintlify.apiKey mint_...');
        process.exit(1);
      }

      const projectId: string = options.projectId ?? config.integrations?.mintlify?.projectId ?? '';
      if (!projectId) {
        console.error('Error: Mintlify project ID is not set.');
        console.error('  Pass it as a flag: --project-id <id>');
        console.error('  Or set it: daily-summary config set integrations.mintlify.projectId <id>');
        console.error('  Or export: MINTLIFY_PROJECT_ID=<id>');
        process.exit(1);
      }

      const mode = options.production ? 'production' : 'preview';
      const client = new MintlifyDeployClient(apiKey, projectId);

      // Resolve branch for preview
      let branch: string | undefined;
      if (mode === 'preview') {
        branch = options.branch ?? currentBranchName(config.repoPath) ?? config.branch;
        if (!branch || branch === 'HEAD') {
          console.error('Error: Could not determine branch for preview deployment.');
          console.error('  Pass it explicitly: --branch <name>');
          process.exit(1);
        }
      }

      if (!options.poll) {
        // Fire-and-forget
        try {
          const result = mode === 'preview'
            ? await client.triggerPreview(branch!)
            : await client.triggerProduction();
          console.log(`statusId: ${result.statusId}`);
          if ('previewUrl' in result && result.previewUrl) {
            console.log(`previewUrl: ${result.previewUrl}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Error: ${message}`);
          process.exit(1);
        }
        return;
      }

      // Poll until done
      const start = Date.now();
      console.log(`\nTriggering Mintlify ${mode} deployment${branch ? ` (branch: ${branch})` : ''}...\n`);

      try {
        const { statusId, previewUrl, finalStatus, filesChanged } = await client.triggerAndWait(mode, {
          branch,
          onTick(status: MintlifyStatusResponse) {
            const elapsed = formatElapsed(start);
            const msg = `  Deploying... [${status.status}] ${elapsed}`;
            if (process.stdout.isTTY) {
              process.stdout.write(`\r${msg}   `);
            } else {
              console.log(msg);
            }
          },
        });

        if (process.stdout.isTTY) process.stdout.write('\n');

        const success = finalStatus.status === 'success';
        const elapsed = formatElapsed(start);
        const statusLabel = success ? `${GREEN}success${RESET}` : `${RED}failure${RESET}`;
        console.log(`\n  ${BOLD}Status:${RESET}   ${statusLabel} (${elapsed})`);
        if (finalStatus.subdomain) {
          console.log(`  ${BOLD}Site:${RESET}     ${finalStatus.subdomain}`);
        }
        if (previewUrl) {
          console.log(`  ${BOLD}Preview:${RESET}  ${previewUrl}`);
        }
        if (finalStatus.summary) {
          console.log(`  ${BOLD}Summary:${RESET}  ${finalStatus.summary}`);
        }
        if (filesChanged) {
          const total = filesChanged.added.length + filesChanged.modified.length + filesChanged.removed.length;
          if (total > 0) {
            console.log(`  ${BOLD}Files:${RESET}    +${filesChanged.added.length} ~${filesChanged.modified.length} -${filesChanged.removed.length}`);
          }
        }

        const record = client.buildDeployRecord(statusId, mode, finalStatus, { branch, previewUrl });
        appendDeployRecord(record);
        console.log(`\n  ${DIM}Deployment cached. Run: daily-summary mintlify history${RESET}\n`);

        if (!success) process.exit(1);
      } catch (err) {
        if (process.stdout.isTTY) process.stdout.write('\n');
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nError: ${message}`);
        process.exit(1);
      }
    });

  // ── status ───────────────────────────────────────────────────────────────────
  cmd
    .command('status <statusId>')
    .description('Check the status of a Mintlify deployment by statusId')
    .option('--project-id <id>', 'Mintlify project ID (overrides config and MINTLIFY_PROJECT_ID)')
    .action(async (statusId: string, options) => {
      const config = loadConfig();

      const apiKey = config.integrations?.mintlify?.apiKey;
      if (!apiKey) {
        console.error('Error: MINTLIFY_API_KEY is not set.');
        process.exit(1);
      }

      const projectId: string = options.projectId ?? config.integrations?.mintlify?.projectId ?? 'unknown';
      const client = new MintlifyDeployClient(apiKey, projectId);

      try {
        const status = await client.getStatus(statusId);

        console.log(`\n${BOLD}Deployment Status${RESET}\n`);
        const statusColour = status.status === 'success'
          ? GREEN
          : status.status === 'failure'
            ? RED
            : YELLOW;
        pass('statusId', statusId);
        console.log(`  ${statusColour}●${RESET} ${'status'.padEnd(20)} ${DIM}${status.status}${RESET}`);
        if (status.subdomain) pass('subdomain', status.subdomain);
        if (status.summary) pass('summary', status.summary);
        if (status.createdAt) pass('created', status.createdAt);
        if (status.endedAt) pass('ended', status.endedAt);
        if (status.commit) {
          pass('commit', `${status.commit.sha.slice(0, 7)} ${status.commit.message}`);
          const fc = status.commit.filesChanged;
          if (fc) {
            pass('files changed', `+${fc.added.length} ~${fc.modified.length} -${fc.removed.length}`);
          }
        }
        if (status.source) skip('source', status.source);
        console.log();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  // ── history ──────────────────────────────────────────────────────────────────
  cmd
    .command('history')
    .description('List cached Mintlify deployment records')
    .option('--limit <n>', 'number of records to show', '20')
    .action((options) => {
      const limit = parseInt(options.limit, 10);
      const records = listDeployRecords(isNaN(limit) ? 20 : limit);

      if (records.length === 0) {
        console.log('No deployment records yet. Run: daily-summary mintlify trigger');
        return;
      }

      const rows = records.map((r) => ({
        date: r.triggeredAt.split('T')[0],
        mode: r.mode,
        branch: r.branch ?? '—',
        status: r.finalStatus,
        location: r.previewUrl ?? r.subdomain ?? '—',
      }));

      const colWidths = {
        date: Math.max(10, ...rows.map((r) => r.date.length)),
        mode: Math.max(4, ...rows.map((r) => r.mode.length)),
        branch: Math.max(6, ...rows.map((r) => r.branch.length)),
        status: Math.max(7, ...rows.map((r) => r.status.length)),
      };

      const header = [
        'Date'.padEnd(colWidths.date),
        'Mode'.padEnd(colWidths.mode),
        'Branch'.padEnd(colWidths.branch),
        'Status'.padEnd(colWidths.status),
        'Location',
      ].join('  ');

      console.log(header);
      console.log('-'.repeat(header.length));

      for (const row of rows) {
        const statusColour = row.status === 'success' ? GREEN : row.status === 'failure' ? RED : YELLOW;
        console.log(
          [
            row.date.padEnd(colWidths.date),
            row.mode.padEnd(colWidths.mode),
            row.branch.padEnd(colWidths.branch),
            `${statusColour}${row.status}${RESET}`.padEnd(colWidths.status + statusColour.length + RESET.length),
            shortenPath(row.location),
          ].join('  ')
        );
      }
    });

  return cmd;
}
