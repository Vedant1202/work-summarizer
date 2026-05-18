import fs from 'fs';
import path from 'path';
import os from 'os';
import { DocTask, DocExportFormat } from './types';

const DOC_TASKS_DIR = path.join(os.homedir(), '.daily-summary', 'doc-tasks');

const SEVERITY_LABEL: Record<string, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

function buildMarkdown(
  tasks: DocTask[],
  repoName: string,
  date: string,
  branch: string,
  timeWindow: string,
): string {
  const accepted = tasks.filter((t) => t.status === 'accepted');
  const lines: string[] = [
    `# Documentation Tasks — ${date}`,
    '',
    `Generated from: **${repoName}** · \`${branch}\` · last ${timeWindow}`,
    `Accepted: **${accepted.length}** task${accepted.length !== 1 ? 's' : ''}`,
    '',
    '---',
  ];

  for (const task of accepted) {
    const label = SEVERITY_LABEL[task.severity] ?? task.severity.toUpperCase();
    lines.push('', `## [${label}] ${task.title}`, '');
    lines.push(`**Commit:** \`${task.commitSha.slice(0, 7)}\` ${task.commitMessage}`);
    lines.push(`**Category:** ${task.category}`);
    lines.push(`**File:** \`${task.triggerFile}\``);
    if (task.description) {
      lines.push('', task.description);
    }
    lines.push('', '### Action Items');
    for (const item of task.actionItems) {
      lines.push(`- [ ] ${item}`);
    }
    if (task.suggestedDocFiles.length > 0) {
      lines.push('', `**Suggested files:** ${task.suggestedDocFiles.join(', ')}`);
    }
    lines.push('', '---');
  }

  return lines.join('\n').trim() + '\n';
}

export function exportDocTasks(
  tasks: DocTask[],
  repoName: string,
  date: string,
  branch: string,
  timeWindow: string,
  format: DocExportFormat,
): string[] {
  const accepted = tasks.filter((t) => t.status === 'accepted');
  if (accepted.length === 0) return [];

  fs.mkdirSync(DOC_TASKS_DIR, { recursive: true });
  const base = `${date}-${repoName}`;
  const written: string[] = [];

  if (format === 'markdown' || format === 'both') {
    const mdPath = path.join(DOC_TASKS_DIR, `${base}.md`);
    fs.writeFileSync(mdPath, buildMarkdown(tasks, repoName, date, branch, timeWindow), 'utf8');
    written.push(mdPath);
  }

  if (format === 'json' || format === 'both') {
    const jsonPath = path.join(DOC_TASKS_DIR, `${base}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(accepted, null, 2) + '\n', 'utf8');
    written.push(jsonPath);
  }

  return written;
}
