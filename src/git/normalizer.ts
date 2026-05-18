import { Commit } from './ingestion';
import { CommitCategory, Config } from '../config/types';

export interface NormalizedCommit {
  sha: string;
  author: string;
  timestamp: string;
  message: string;
  changedFiles: string[];
  diffStat: { insertions: number; deletions: number };
  diff: string;
  diffTruncated: boolean;
  category: CommitCategory;
}

const NOISE_FILE_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /composer\.lock$/,
  /Gemfile\.lock$/,
  /Podfile\.lock$/,
  /.*\.lock$/,
  /dist\//,
  /build\//,
  /\.min\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz)$/i,
];

const BINARY_DIFF_PATTERN = /^Binary files /m;

// Conventional commit prefix pattern: feat(scope): or feat:
const CONVENTIONAL_PREFIX = /^(feat|fix|refactor|docs|chore|perf|test)(\([^)]*\))?!?:/i;

const KEYWORD_RULES: Array<{ pattern: RegExp; category: CommitCategory }> = [
  { pattern: /\b(add|implement|introduce|create|new feature|support)\b/i, category: 'feat' },
  { pattern: /\b(fix|resolve|correct|patch|repair|bug|issue|regression)\b/i, category: 'fix' },
  { pattern: /\b(refactor|clean|extract|reorganize|restructure|simplify|rename|move)\b/i, category: 'refactor' },
  { pattern: /\b(docs?|readme|changelog|comment|document|guide|tutorial)\b/i, category: 'docs' },
  { pattern: /\b(bump|upgrade|update dep|dependency|ci|build|release|version|config)\b/i, category: 'chore' },
  { pattern: /\b(perf|performance|speed|optimize|faster|latency|throughput|cache)\b/i, category: 'perf' },
  { pattern: /\b(test|spec|coverage|unit test|integration test|e2e)\b/i, category: 'test' },
];

export function categorizeCommit(message: string): CommitCategory {
  const match = message.match(CONVENTIONAL_PREFIX);
  if (match) {
    return match[1].toLowerCase() as CommitCategory;
  }

  for (const { pattern, category } of KEYWORD_RULES) {
    if (pattern.test(message)) return category;
  }

  return 'other';
}

function isNoisyFile(filePath: string): boolean {
  return NOISE_FILE_PATTERNS.some((re) => re.test(filePath));
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(escaped);
}

function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (p.includes('*') || p.includes('?')) return globToRegex(p).test(filePath);
    return filePath.includes(p);
  });
}

function stripNoisyFilesFromDiff(rawDiff: string, excludePaths?: string[]): string {
  const hunks = rawDiff.split(/(?=^diff --git )/m);
  return hunks
    .filter((hunk) => {
      if (!hunk.startsWith('diff --git')) return true;

      const match = hunk.match(/^diff --git a\/(.*?) b\//m);
      if (!match) return true;

      const filePath = match[1];
      if (isNoisyFile(filePath)) return false;
      if (BINARY_DIFF_PATTERN.test(hunk)) return false;
      if (excludePaths?.length && matchesAnyPattern(filePath, excludePaths)) return false;
      return true;
    })
    .join('');
}

const MAX_DIFF_CHARS = 8000;

export function normalizeDiff(commits: Commit[], config?: Pick<Config, 'excludePaths' | 'focusAreas'>): NormalizedCommit[] {
  let remainingBudget = MAX_DIFF_CHARS;

  return commits
    .map((commit): NormalizedCommit | null => {
      const category = categorizeCommit(commit.message);

      let cleanedFiles = commit.changedFiles.filter((f) => !isNoisyFile(f));
      if (config?.excludePaths?.length) {
        cleanedFiles = cleanedFiles.filter((f) => !matchesAnyPattern(f, config.excludePaths!));
      }

      // If focusAreas is set, drop commits that touch nothing in those areas
      if (config?.focusAreas?.length) {
        const touchesFocus = commit.changedFiles.some((f) => matchesAnyPattern(f, config.focusAreas!));
        if (!touchesFocus) return null;
      }

      const filteredDiff = stripNoisyFilesFromDiff(commit.rawDiff, config?.excludePaths);

      let diff: string;
      let diffTruncated = false;

      if (filteredDiff.length <= remainingBudget) {
        diff = filteredDiff;
        remainingBudget -= filteredDiff.length;
      } else if (remainingBudget > 0) {
        diff = filteredDiff.slice(0, remainingBudget) + '\n... [diff truncated]';
        remainingBudget = 0;
        diffTruncated = true;
      } else {
        diff = '';
        diffTruncated = true;
      }

      return {
        sha: commit.sha,
        author: commit.author,
        timestamp: commit.timestamp,
        message: commit.message,
        changedFiles: cleanedFiles,
        diffStat: commit.diffStat,
        diff,
        diffTruncated,
        category,
      };
    })
    .filter((c): c is NormalizedCommit => c !== null);
}
