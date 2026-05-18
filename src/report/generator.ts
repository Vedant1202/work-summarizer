import path from 'path';
import { Config } from '../config/types';
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

function formatDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  return d.toISOString().split('T')[0];
}

function buildMarkdown(
  date: string,
  repoName: string,
  branch: string,
  timeWindow: string,
  commits: NormalizedCommit[],
  summary: string,
): string {
  const commitList = commits
    .map((c) => {
      const stat = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
      return `- \`${c.sha.slice(0, 7)}\` ${c.message} (${stat})`;
    })
    .join('\n');

  return `# Daily Stand-up — ${date}

**Repo:** ${repoName}
**Branch:** ${branch}
**Period:** last ${timeWindow}
**Commits:** ${commits.length}

---

## Summary

${summary}

---

## Commits

${commitList || '_No commits in this period._'}
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
