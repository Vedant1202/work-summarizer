import path from 'path';
import { Config, CommitCategory } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';

export interface Report {
  date: string;
  repoName: string;
  branch: string;
  timeWindow: string;
  commitCount: number;
  summary: string;
  commits: NormalizedCommit[];
  content: string;
}

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

function formatDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  return d.toISOString().split('T')[0];
}

function buildCommitsByCategory(commits: NormalizedCommit[]): string {
  const groups = new Map<CommitCategory, NormalizedCommit[]>();
  for (const c of commits) {
    const list = groups.get(c.category) ?? [];
    list.push(c);
    groups.set(c.category, list);
  }

  const sections = CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => {
      const label = CATEGORY_LABELS[cat];
      const items = groups.get(cat)!
        .map((c) => {
          const stat = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
          return `- \`${c.sha.slice(0, 7)}\` ${c.message} (${stat})`;
        })
        .join('\n');
      return `### ${label}\n${items}`;
    });

  return sections.length > 0 ? sections.join('\n\n') : '_No commits in this period._';
}

function buildMarkdown(
  date: string,
  repoName: string,
  branch: string,
  timeWindow: string,
  commits: NormalizedCommit[],
  summary: string,
): string {
  return `# Daily Stand-up — ${date}

**Repo:** ${repoName} | **Branch:** ${branch} | **Period:** last ${timeWindow} | **Commits:** ${commits.length}

---

## Summary

${summary}

---

## Commits by Category

${buildCommitsByCategory(commits)}
`.trim() + '\n';
}

export function generateReport(commits: NormalizedCommit[], summary: string, config: Config): Report {
  const date = formatDate();
  const repoName = path.basename(path.resolve(config.repoPath));
  const content = buildMarkdown(date, repoName, config.branch, config.timeWindow, commits, summary);

  return {
    date,
    repoName,
    branch: config.branch,
    timeWindow: config.timeWindow,
    commitCount: commits.length,
    summary,
    commits,
    content,
  };
}
