import path from 'path';
import { loadConfig } from '../../config/loader';
import { ingestCommits } from '../../git/ingestion';
import { normalizeDiff } from '../../git/normalizer';
import { GeminiProvider } from '../../llm/gemini';
import { detectDocSignals } from '../../docs/detector';
import { generateDocTasks } from '../../docs/generator';
import { exportDocTasks } from '../../docs/exporter';
import { openInEditor } from '../review';
import { DocTask, DocExportFormat } from '../../docs/types';
import { LinearIntegrationClient } from '../../integrations/linear/client';

interface DocsOptions {
  since?: string;
  branch?: string;
  review: boolean;
  format?: string;
  llm: boolean;
  createIssues: boolean;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '\x1b[31m',    // red
  medium: '\x1b[33m',  // yellow
  low: '\x1b[36m',     // cyan
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function colorSeverity(sev: string): string {
  return `${SEVERITY_COLOR[sev] ?? ''}${BOLD}[${sev.toUpperCase()}]${RESET}`;
}

function printTask(task: DocTask, index: number, total: number): void {
  const bar = '─'.repeat(54);
  console.log(`\n${BOLD}┌${bar}┐${RESET}`);
  console.log(`${BOLD}│${RESET}  Doc Task ${index + 1} of ${total}  ${colorSeverity(task.severity)} · ${task.category.padEnd(16)}${BOLD}│${RESET}`);
  console.log(`${BOLD}└${bar}┘${RESET}`);
  console.log();
  console.log(`  ${DIM}Commit:${RESET}  ${task.commitMessage}`);
  console.log(`  ${DIM}File:${RESET}    ${task.triggerFile}`);
  console.log(`  ${DIM}Signal:${RESET}  ${task.description}`);
  console.log();
  console.log(`  ${BOLD}${task.title}${RESET}`);
  console.log();
  console.log(`  Action items:`);
  for (const item of task.actionItems) {
    console.log(`    □ ${item}`);
  }
  if (task.suggestedDocFiles.length > 0) {
    console.log();
    console.log(`  ${DIM}Suggested files:${RESET} ${task.suggestedDocFiles.join(', ')}`);
  }
  console.log();
}

async function promptKey(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      // Non-interactive: default to accept
      process.stdout.write('a\n');
      resolve('a');
      return;
    }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const handler = (key: string) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', handler);
      process.stdout.write(key + '\n');
      resolve(key.toLowerCase());
    };
    process.stdin.once('data', handler);
  });
}

async function reviewTasks(tasks: DocTask[]): Promise<DocTask[]> {
  const reviewed = [...tasks];

  for (let i = 0; i < reviewed.length; i++) {
    const task = reviewed[i];
    printTask(task, i, reviewed.length);

    const key = await promptKey(`  ${BOLD}[A]ccept  [R]eject  [E]dit  [S]kip${RESET}  (a/r/e/s) > `);

    if (key === 'a') {
      reviewed[i] = { ...task, status: 'accepted' };
      console.log('  ✓ Accepted');
    } else if (key === 'r') {
      reviewed[i] = { ...task, status: 'rejected' };
      console.log('  ✗ Rejected');
    } else if (key === 'e') {
      const jsonRepresentation = JSON.stringify(
        { title: task.title, description: task.description, actionItems: task.actionItems },
        null,
        2,
      );
      try {
        const edited = await openInEditor(jsonRepresentation);
        const parsed = JSON.parse(edited) as {
          title?: string;
          description?: string;
          actionItems?: string[];
        };
        reviewed[i] = {
          ...task,
          status: 'accepted',
          title: parsed.title ?? task.title,
          description: parsed.description ?? task.description,
          actionItems: parsed.actionItems ?? task.actionItems,
        };
        console.log('  ✓ Accepted (edited)');
      } catch {
        reviewed[i] = { ...task, status: 'accepted' };
        console.log('  ✓ Accepted (edit failed, using original)');
      }
    } else {
      // skip or any other key
      console.log('  → Skipped');
    }
  }

  return reviewed;
}

function buildIssueBody(task: DocTask): string {
  const lines = [
    task.description,
    '',
    `**Commit:** \`${task.commitSha.slice(0, 7)}\` ${task.commitMessage}`,
    `**Trigger file:** \`${task.triggerFile}\``,
    '',
    '## Action Items',
    ...task.actionItems.map((item) => `- [ ] ${item}`),
  ];
  if (task.suggestedDocFiles.length > 0) {
    lines.push('', '## Suggested Documentation Files', ...task.suggestedDocFiles.map((f) => `- \`${f}\``));
  }
  return lines.join('\n');
}

async function promptYesNo(prompt: string): Promise<boolean> {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      process.stdout.write('n\n');
      resolve(false);
      return;
    }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const handler = (key: string) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', handler);
      const answer = key.toLowerCase();
      process.stdout.write(answer + '\n');
      resolve(answer === 'y');
    };
    process.stdin.once('data', handler);
  });
}

async function createLinearIssues(
  tasks: DocTask[],
  client: LinearIntegrationClient,
  teamId: string,
): Promise<DocTask[]> {
  const result = [...tasks];
  for (let i = 0; i < result.length; i++) {
    const task = result[i];
    if (task.status !== 'accepted') continue;

    const yes = await promptYesNo(
      `  ${BOLD}Create Linear issue for:${RESET} "${task.title}" (y/n) > `,
    );
    if (!yes) continue;

    try {
      const { identifier, url } = await client.createIssue({
        title: task.title,
        description: buildIssueBody(task),
        teamId,
        priority: task.severity === 'high' ? 2 : task.severity === 'medium' ? 3 : 4,
      });
      result[i] = { ...task, linearIssueUrl: url, linearIssueIdentifier: identifier };
      console.log(`  ✓ Created ${identifier}: ${url}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed to create issue: ${message}`);
    }
  }
  return result;
}

export async function docsCommand(options: DocsOptions): Promise<void> {
  const config = loadConfig();
  if (options.since) config.timeWindow = options.since;
  if (options.branch) config.branch = options.branch;

  const format = (options.format ?? 'markdown') as DocExportFormat;
  const repoName = path.basename(path.resolve(config.repoPath));
  const date = new Date().toISOString().split('T')[0];

  console.log(`Scanning commits on "${config.branch}" since ${config.timeWindow}...`);
  const commits = ingestCommits(config, { since: config.timeWindow, branch: config.branch });

  if (commits.length === 0) {
    console.log('No commits found in the specified time window.');
    return;
  }

  const normalized = normalizeDiff(commits, config);
  console.log(`Analyzing ${normalized.length} commit(s) for documentation signals...`);

  const signals = detectDocSignals(normalized);

  if (signals.length === 0) {
    console.log('No documentation tasks detected. Looks like no doc-impacting changes in this period.');
    return;
  }

  console.log(`Found ${signals.length} potential documentation task(s).`);

  // Optional LLM enrichment
  let provider: GeminiProvider | undefined;
  if (options.llm && config.llm.apiKey && config.llm.model) {
    provider = new GeminiProvider(config.llm.apiKey, config.llm.model);
    console.log(`Enriching task descriptions with ${config.llm.model}...`);
  } else if (options.llm) {
    console.log('LLM enrichment requested but GEMINI_API_KEY or GEMINI_MODEL not set — using templates.');
  }

  let tasks = await generateDocTasks(signals, config.repoPath, options.llm && !!provider, provider);

  if (!options.review) {
    // Auto-accept all
    tasks = tasks.map((t) => ({ ...t, status: 'accepted' }));
  } else {
    tasks = await reviewTasks(tasks);
  }

  const accepted = tasks.filter((t) => t.status === 'accepted').length;
  const rejected = tasks.filter((t) => t.status === 'rejected').length;
  const skipped = tasks.filter((t) => t.status === 'pending').length;

  console.log(`\nReview complete: Accepted ${accepted} / Rejected ${rejected} / Skipped ${skipped}`);

  if (accepted === 0) {
    console.log('No tasks accepted — nothing to export.');
    return;
  }

  if (options.createIssues) {
    const linearKey = config.integrations?.linear?.apiKey;
    const teamId = config.integrations?.linear?.teamId;

    if (!linearKey) {
      console.warn('\nWarning: --create-issues requires LINEAR_API_KEY. Set it and try again.');
      console.warn('  export LINEAR_API_KEY=<key>');
    } else if (!teamId) {
      console.warn('\nWarning: --create-issues requires a Linear team ID. Configure it with:');
      console.warn('  daily-summary config set integrations.linear.teamId <team-id>');
    } else {
      console.log('\nCreating Linear issues for accepted tasks...');
      const linearClient = new LinearIntegrationClient(linearKey);
      tasks = await createLinearIssues(tasks, linearClient, teamId);
    }
  }

  const paths = exportDocTasks(tasks, repoName, date, config.branch, config.timeWindow, format);
  for (const p of paths) {
    console.log(`Doc tasks saved to: ${p}`);
  }
}
