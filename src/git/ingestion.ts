import { execSync } from 'child_process';
import path from 'path';
import { Config } from '../config/types';

export interface DiffStat {
  insertions: number;
  deletions: number;
}

export interface Commit {
  sha: string;
  author: string;
  timestamp: string;
  message: string;
  changedFiles: string[];
  diffStat: DiffStat;
  rawDiff: string;
}

const NULL_BYTE = '\x00';

function parseDiffStat(statLine: string): DiffStat {
  const insertMatch = statLine.match(/(\d+) insertion/);
  const deleteMatch = statLine.match(/(\d+) deletion/);
  return {
    insertions: insertMatch ? parseInt(insertMatch[1], 10) : 0,
    deletions: deleteMatch ? parseInt(deleteMatch[1], 10) : 0,
  };
}

function parseChangedFiles(statBlock: string): string[] {
  return statBlock
    .split('\n')
    .filter((line) => line.includes('|') || line.match(/^\s+\S+.*\+{0,}/))
    .map((line) => line.trim().split('|')[0].trim())
    .filter(Boolean);
}

function parseSince(timeWindow: string): string {
  // Accepts formats like: 24h, 2d, 1w, 30m
  const match = timeWindow.match(/^(\d+)(m|h|d|w)$/);
  if (!match) return timeWindow; // pass through if it's already a git-compatible string

  const [, amount, unit] = match;
  const units: Record<string, string> = {
    m: 'minutes',
    h: 'hours',
    d: 'days',
    w: 'weeks',
  };
  return `${amount} ${units[unit]} ago`;
}

export function ingestCommits(config: Config, overrides: { since?: string; branch?: string } = {}): Commit[] {
  const repoPath = path.resolve(config.repoPath);
  const since = parseSince(overrides.since ?? config.timeWindow);
  const branch = overrides.branch ?? config.branch;

  const gitOpts = { cwd: repoPath, encoding: 'utf8' as const };

  // Get list of SHAs in range, null-delimited for reliable parsing
  const shaList = execSync(
    `git log ${branch} --since="${since}" --format=%H${NULL_BYTE}`,
    gitOpts
  )
    .split(NULL_BYTE)
    .map((s) => s.trim())
    .filter(Boolean);

  if (shaList.length === 0) return [];

  const commits: Commit[] = [];

  for (const sha of shaList) {
    // Get commit metadata
    const meta = execSync(
      `git show --no-patch --format="%an${NULL_BYTE}%aI${NULL_BYTE}%s" ${sha}`,
      gitOpts
    ).trim();

    const [author, timestamp, message] = meta.split(NULL_BYTE);

    // Get stat summary (changed files + insertion/deletion counts)
    const statOutput = execSync(`git show --stat --no-patch ${sha}`, gitOpts);
    const statLines = statOutput.trim().split('\n');
    const summaryLine = statLines[statLines.length - 1];
    const diffStat = parseDiffStat(summaryLine);
    const changedFiles = parseChangedFiles(statLines.slice(0, -1).join('\n'));

    // Get raw diff (we'll cap it in the normalizer)
    const rawDiff = execSync(`git show --patch --no-color ${sha}`, gitOpts);

    commits.push({
      sha,
      author: author?.trim() ?? '',
      timestamp: timestamp?.trim() ?? '',
      message: message?.trim() ?? '',
      changedFiles,
      diffStat,
      rawDiff,
    });
  }

  return commits;
}
