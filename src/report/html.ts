import { CommitCategory } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';
import { Report } from './generator';

const CATEGORY_LABELS: Record<CommitCategory, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance',
  refactor: 'Refactors & Improvements',
  test: 'Tests',
  docs: 'Documentation',
  chore: 'Chores & Maintenance',
  other: 'Other Changes',
};

const CATEGORY_ORDER: CommitCategory[] = ['feat', 'fix', 'perf', 'refactor', 'test', 'docs', 'chore', 'other'];

const CATEGORY_COLORS: Record<CommitCategory, string> = {
  feat: '#22c55e',
  fix: '#ef4444',
  perf: '#f59e0b',
  refactor: '#8b5cf6',
  test: '#06b6d4',
  docs: '#3b82f6',
  chore: '#6b7280',
  other: '#9ca3af',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSummaryAsHtml(summary: string): string {
  const lines = summary.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { result.push('</ul>'); inList = false; }
      continue;
    }
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      const level = trimmed.startsWith('### ') ? 3 : 2;
      result.push(`<h${level}>${escapeHtml(trimmed.replace(/^#+\s*/, ''))}</h${level}>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<p>${escapeHtml(trimmed)}</p>`);
    }
  }
  if (inList) result.push('</ul>');
  return result.join('\n');
}

function buildCommitRows(commits: NormalizedCommit[]): string {
  const groups = new Map<CommitCategory, NormalizedCommit[]>();
  for (const c of commits) {
    const list = groups.get(c.category) ?? [];
    list.push(c);
    groups.set(c.category, list);
  }

  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => {
      const color = CATEGORY_COLORS[cat];
      const label = CATEGORY_LABELS[cat];
      const rows = groups.get(cat)!
        .map((c) => {
          const stat = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
          return `<tr>
          <td><code>${escapeHtml(c.sha.slice(0, 7))}</code></td>
          <td>${escapeHtml(c.message)}</td>
          <td class="stat">${escapeHtml(stat)}</td>
        </tr>`;
        })
        .join('\n');

      return `<section class="category">
      <h3 style="border-left: 4px solid ${color}; padding-left: 10px;">${escapeHtml(label)}</h3>
      <table>
        <thead><tr><th>SHA</th><th>Message</th><th>Changes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
    })
    .join('\n');
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a2e; background: #f8f9fa; padding: 0; }
  .page { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
  header { background: #1a1a2e; color: #fff; padding: 28px 32px; border-radius: 8px; margin-bottom: 28px; }
  header h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 10px; }
  .meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; opacity: 0.85; }
  .meta span { background: rgba(255,255,255,0.12); padding: 3px 10px; border-radius: 20px; }
  .card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 24px 28px; margin-bottom: 24px; }
  .card h2 { font-size: 1.1rem; font-weight: 600; color: #374151; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
  .summary-body p { margin-bottom: 10px; }
  .summary-body h2, .summary-body h3 { margin: 18px 0 8px; font-size: 1rem; font-weight: 600; color: #111827; }
  .summary-body ul { padding-left: 20px; margin-bottom: 10px; }
  .summary-body li { margin-bottom: 4px; }
  .category { margin-bottom: 20px; }
  .category h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 10px; color: #111827; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  thead th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-weight: 600; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td { padding: 8px 12px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
  code { font-family: 'SFMono-Regular', Consolas, monospace; background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 0.85em; }
  .stat { white-space: nowrap; font-family: monospace; color: #6b7280; font-size: 0.85em; }
  footer { text-align: center; font-size: 0.78rem; color: #9ca3af; margin-top: 32px; }
`;

export function buildHtml(report: Report): string {
  const summaryHtml = renderSummaryAsHtml(report.summary);
  const commitRows = buildCommitRows(report.commits);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Stand-up — ${escapeHtml(report.date)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="page">
    <header>
      <h1>Daily Stand-up &mdash; ${escapeHtml(report.date)}</h1>
      <div class="meta">
        <span>Repo: ${escapeHtml(report.repoName)}</span>
        <span>Branch: ${escapeHtml(report.branch)}</span>
        <span>Period: last ${escapeHtml(report.timeWindow)}</span>
        <span>${report.commitCount} commit${report.commitCount !== 1 ? 's' : ''}</span>
      </div>
    </header>

    <div class="card">
      <h2>Summary</h2>
      <div class="summary-body">
        ${summaryHtml}
      </div>
    </div>

    <div class="card">
      <h2>Commits by Category</h2>
      ${commitRows || '<p><em>No commits in this period.</em></p>'}
    </div>

    <footer>Generated by daily-summary &bull; ${escapeHtml(new Date().toISOString())}</footer>
  </div>
</body>
</html>`;
}
