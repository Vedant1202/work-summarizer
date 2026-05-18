import { Commit } from './ingestion';

export interface NormalizedCommit {
  sha: string;
  author: string;
  timestamp: string;
  message: string;
  changedFiles: string[];
  diffStat: { insertions: number; deletions: number };
  diff: string;
  diffTruncated: boolean;
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

function isNoisyFile(filePath: string): boolean {
  return NOISE_FILE_PATTERNS.some((re) => re.test(filePath));
}

function stripNoisyFilesFromDiff(rawDiff: string): string {
  // Split diff into per-file hunks by "diff --git" headers
  const hunks = rawDiff.split(/(?=^diff --git )/m);
  return hunks
    .filter((hunk) => {
      if (!hunk.startsWith('diff --git')) return true; // keep preamble lines

      // Extract file path from "diff --git a/path b/path"
      const match = hunk.match(/^diff --git a\/(.*?) b\//m);
      if (!match) return true;

      const filePath = match[1];
      if (isNoisyFile(filePath)) return false;
      if (BINARY_DIFF_PATTERN.test(hunk)) return false;
      return true;
    })
    .join('');
}

const MAX_DIFF_CHARS = 8000;

export function normalizeDiff(commits: Commit[]): NormalizedCommit[] {
  let remainingBudget = MAX_DIFF_CHARS;

  return commits.map((commit) => {
    const filteredDiff = stripNoisyFilesFromDiff(commit.rawDiff);

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
      changedFiles: commit.changedFiles.filter((f) => !isNoisyFile(f)),
      diffStat: commit.diffStat,
      diff,
      diffTruncated,
    };
  });
}
