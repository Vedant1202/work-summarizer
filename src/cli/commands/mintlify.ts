import { execSync } from 'child_process';
import { Command } from 'commander';
import { loadConfig } from '../../config/loader';
import { MintlifyDeployClient } from '../../integrations/mintlify/deploy';
import { appendDeployRecord, listDeployRecords, filterRecordsSince } from '../../integrations/mintlify/cache';
import { MintlifyDeployRecord, MintlifyStatusResponse } from '../../integrations/mintlify/types';
import { GeminiProvider } from '../../llm/gemini';
import { buildDeploymentSummaryPrompt } from '../../llm/prompts';
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
    .option('--fire-and-forget', 'print statusId and exit without waiting for completion')
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

      if (options.fireAndForget) {
        // Fire-and-forget — trigger and exit immediately
        try {
          const result = mode === 'preview'
            ? await client.triggerPreview(branch!)
            : await client.triggerProduction();
          console.log(`statusId:   ${result.statusId}`);
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
        console.log(`\n  ${BOLD}Status ID:${RESET} ${statusId}`);
        console.log(`  ${BOLD}Status:${RESET}    ${statusLabel} (${elapsed})`);
        if (finalStatus.subdomain) {
          console.log(`  ${BOLD}Site:${RESET}      ${finalStatus.subdomain}`);
        }
        if (previewUrl) {
          console.log(`  ${BOLD}Preview:${RESET}   ${previewUrl}`);
        }
        if (finalStatus.summary) {
          console.log(`  ${BOLD}Summary:${RESET}   ${finalStatus.summary}`);
        }
        if (filesChanged) {
          const total = filesChanged.added.length + filesChanged.modified.length + filesChanged.removed.length;
          if (total > 0) {
            console.log(`  ${BOLD}Files:${RESET}     +${filesChanged.added.length} ~${filesChanged.modified.length} -${filesChanged.removed.length}`);
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

  // ── summary ──────────────────────────────────────────────────────────────────
  cmd
    .command('summary')
    .description('Summarize Mintlify deployments over a time window using LLM')
    .option('--since <duration>', 'time window: 24h, 7d, 1w, etc.', '24h')
    .option('--raw', 'print raw file change table without LLM summary')
    .option('--project-id <id>', 'Mintlify project ID (used for back-filling missing data)')
    .action(async (options) => {
      const config = loadConfig();
      const since: string = options.since;

      // Validate LLM credentials unless --raw
      if (!options.raw) {
        if (!config.llm.apiKey) {
          console.error('Error: GEMINI_API_KEY is not set. Use --raw to skip LLM, or run: daily-summary config init');
          process.exit(1);
        }
        if (!config.llm.model) {
          console.error('Error: GEMINI_MODEL is not set. Use --raw to skip LLM, or run: daily-summary config init');
          process.exit(1);
        }
      }

      const all = listDeployRecords();
      const records = filterRecordsSince(all, since);

      if (records.length === 0) {
        console.log(`No Mintlify deployments found in the last ${since}.`);
        console.log('Run: daily-summary mintlify trigger');
        return;
      }

      const previews = records.filter((r) => r.mode === 'preview').length;
      const productions = records.filter((r) => r.mode === 'production').length;
      console.log(`\n${BOLD}Mintlify Docs Summary${RESET} — last ${since}`);
      console.log(`${records.length} deployment(s): ${previews} preview · ${productions} production\n`);

      // Header table
      const rows = records.map((r) => ({
        date: r.triggeredAt.replace('T', ' ').slice(0, 16),
        mode: r.mode,
        branch: r.branch ?? '—',
        status: r.finalStatus,
      }));
      const colWidths = {
        date: Math.max(16, ...rows.map((r) => r.date.length)),
        mode: Math.max(4, ...rows.map((r) => r.mode.length)),
        branch: Math.max(6, ...rows.map((r) => r.branch.length)),
        status: Math.max(7, ...rows.map((r) => r.status.length)),
      };
      const header = [
        'Date'.padEnd(colWidths.date),
        'Mode'.padEnd(colWidths.mode),
        'Branch'.padEnd(colWidths.branch),
        'Status',
      ].join('  ');
      console.log(header);
      console.log('-'.repeat(header.length));
      for (const row of rows) {
        const statusColour = row.status === 'success' ? GREEN : row.status === 'failure' ? RED : YELLOW;
        console.log([
          row.date.padEnd(colWidths.date),
          row.mode.padEnd(colWidths.mode),
          row.branch.padEnd(colWidths.branch),
          `${statusColour}${row.status}${RESET}`,
        ].join('  '));
      }

      // Back-fill any records missing filesChanged via the status API
      const projectId = options.projectId ?? config.integrations?.mintlify?.projectId;
      const apiKey = config.integrations?.mintlify?.apiKey;
      const needsBackfill = records.filter((r) => !r.filesChanged);
      if (needsBackfill.length > 0 && apiKey && projectId) {
        const client = new MintlifyDeployClient(apiKey, projectId);
        for (const record of needsBackfill) {
          try {
            const status = await client.getStatus(record.statusId);
            if (status.commit?.filesChanged) {
              (record as MintlifyDeployRecord).filesChanged = status.commit.filesChanged;
              (record as MintlifyDeployRecord).commitSha = status.commit.sha;
              (record as MintlifyDeployRecord).commitMessage = status.commit.message;
            }
          } catch {
            // best-effort; skip if unavailable
          }
        }
      }

      if (options.raw) {
        // Raw output — print per-deployment file change tables
        console.log();
        records.forEach((r, i) => {
          const date = r.triggeredAt.replace('T', ' ').slice(0, 16);
          const sha = r.commitSha ? r.commitSha.slice(0, 7) : 'unknown';
          console.log(`${BOLD}Deployment ${i + 1}${RESET} — ${date} · ${r.mode} · ${r.branch ?? 'unknown'}`);
          if (r.commitMessage) {
            console.log(`  ${DIM}Commit: ${sha} "${r.commitMessage}"${RESET}`);
          }
          if (r.filesChanged) {
            const { added, modified, removed } = r.filesChanged;
            if (added.length > 0) console.log(`  ${GREEN}+${RESET} added:    ${added.join(', ')}`);
            if (modified.length > 0) console.log(`  ${YELLOW}~${RESET} modified: ${modified.join(', ')}`);
            if (removed.length > 0) console.log(`  ${RED}-${RESET} removed:  ${removed.join(', ')}`);
            if (added.length === 0 && modified.length === 0 && removed.length === 0) {
              console.log(`  ${DIM}(no file changes recorded)${RESET}`);
            }
          } else {
            console.log(`  ${DIM}(no file data — trigger with polling to capture changes)${RESET}`);
          }
          console.log();
        });
        return;
      }

      // LLM summary
      console.log(`\n${BOLD}Summary${RESET}`);
      console.log('-'.repeat(40));
      try {
        const provider = new GeminiProvider(config.llm.apiKey!, config.llm.model!);
        const prompt = buildDeploymentSummaryPrompt(records);
        const summary = await provider.rawPrompt(prompt);
        console.log(summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nLLM error: ${message}`);
        console.error('Use --raw to print file changes without LLM.');
        process.exit(1);
      }
      console.log();
    });

  return cmd;
}
