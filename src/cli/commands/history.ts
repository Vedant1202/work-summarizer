import fs from 'fs';
import { loadConfig } from '../../config/loader';
import { listAllReports, getLastReportPath } from '../../report/exporter';
import { openInEditor } from '../review';
import os from 'os';

interface HistoryOptions {
  open?: string;
  last?: boolean;
}

function parseCommitCount(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/\*\*Commits:\*\* (\d+)/);
    if (match) return parseInt(match[1], 10);
    // Fallback: count lines starting with "- `" in the commits section
    return (content.match(/^- `[0-9a-f]{7}`/gm) ?? []).length;
  } catch {
    return 0;
  }
}

function shortenPath(p: string): string {
  return p.replace(os.homedir(), '~');
}

export async function historyCommand(options: HistoryOptions): Promise<void> {
  const config = loadConfig();

  if (options.open) {
    const reportPath = getLastReportPath(config, options.open);
    if (!reportPath) {
      console.error(`No report found for date: ${options.open}`);
      process.exit(1);
    }
    const content = fs.readFileSync(reportPath, 'utf8');
    await openInEditor(content);
    return;
  }

  if (options.last) {
    const reportPath = getLastReportPath(config);
    if (!reportPath) {
      console.error('No reports yet. Run `daily-summary run` first.');
      process.exit(1);
    }
    const content = fs.readFileSync(reportPath, 'utf8');
    await openInEditor(content);
    return;
  }

  const reports = listAllReports(config);

  if (reports.length === 0) {
    console.log('No reports yet. Run `daily-summary run` to generate your first report.');
    return;
  }

  const rows = reports.map(({ date, repoName, filePath }) => {
    const count = parseCommitCount(filePath);
    const countLabel = `${count} commit${count !== 1 ? 's' : ''}`;
    return { date, repoName, countLabel, path: shortenPath(filePath) };
  });

  const colWidths = {
    date: Math.max(10, ...rows.map((r) => r.date.length)),
    repo: Math.max(4, ...rows.map((r) => r.repoName.length)),
    count: Math.max(7, ...rows.map((r) => r.countLabel.length)),
  };

  const header = [
    'Date'.padEnd(colWidths.date),
    'Repo'.padEnd(colWidths.repo),
    'Commits'.padEnd(colWidths.count),
    'Path',
  ].join('  ');

  console.log(header);
  console.log('-'.repeat(header.length));

  for (const row of rows) {
    console.log(
      [
        row.date.padEnd(colWidths.date),
        row.repoName.padEnd(colWidths.repo),
        row.countLabel.padEnd(colWidths.count),
        row.path,
      ].join('  ')
    );
  }
}
