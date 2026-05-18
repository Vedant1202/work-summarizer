import { NormalizedCommit } from '../git/normalizer';
import { DocSignal, DocTaskCategory, DocTaskSeverity } from './types';

interface DetectionRule {
  name: string;
  severity: DocTaskSeverity;
  category: DocTaskCategory;
  run: (commit: NormalizedCommit) => Array<{ file: string; pattern: string; diffHunk?: string }>;
}

const TEST_FILE_RE = /\.(spec|test)\.(ts|js|tsx|jsx)$|__tests__\//;
const DIST_FILE_RE = /^(dist|build|out)\//;

function isSignificantFile(f: string): boolean {
  return !TEST_FILE_RE.test(f) && !DIST_FILE_RE.test(f);
}

// Extract lines added in the diff matching a pattern, return up to 3 lines as a hunk snippet
function extractDiffLines(diff: string, pattern: RegExp): string | undefined {
  const lines = diff.split('\n').filter((l) => l.startsWith('+') && pattern.test(l));
  if (lines.length === 0) return undefined;
  return lines.slice(0, 3).join('\n');
}

const RULES: DetectionRule[] = [
  {
    name: 'breaking-change',
    severity: 'high',
    category: 'breaking-change',
    run(commit) {
      const isBreaking =
        /BREAKING[\s_]CHANGE|breaking change|!:/i.test(commit.message) ||
        /\b(deprecate|deprecated|remove[sd]?|migration required)\b/i.test(commit.message);
      if (!isBreaking) return [];
      const file = commit.changedFiles.find(isSignificantFile) ?? commit.changedFiles[0] ?? '(unknown)';
      return [{ file, pattern: 'breaking change keyword in commit message' }];
    },
  },

  {
    name: 'new-export',
    severity: 'high',
    category: 'new-api',
    run(commit) {
      if (!commit.diff) return [];
      const exportRe = /^[+]export\s+(function|class|interface|const|type|enum)\s+(\w+)/m;
      const results: Array<{ file: string; pattern: string; diffHunk?: string }> = [];
      // Check each changed file by scanning diff sections
      const hunks = commit.diff.split(/(?=^diff --git )/m);
      for (const hunk of hunks) {
        const fileMatch = hunk.match(/^diff --git a\/(.*?) b\//m);
        if (!fileMatch) continue;
        const file = fileMatch[1];
        if (!isSignificantFile(file)) continue;
        const diffHunk = extractDiffLines(hunk, exportRe);
        if (diffHunk) {
          const nameMatch = hunk.match(new RegExp(exportRe.source, 'm'));
          const exportName = nameMatch ? nameMatch[2] : 'symbol';
          results.push({ file, pattern: `new export: ${exportName}`, diffHunk });
        }
      }
      return results;
    },
  },

  {
    name: 'cli-option-added',
    severity: 'high',
    category: 'cli-option',
    run(commit) {
      if (!commit.diff) return [];
      const cliFiles = commit.changedFiles.filter(
        (f) => isSignificantFile(f) && /cli|command|cmd/i.test(f),
      );
      if (cliFiles.length === 0) return [];
      const optionRe = /^[+].*\.(option|command)\s*\(/m;
      const results: Array<{ file: string; pattern: string; diffHunk?: string }> = [];
      const hunks = commit.diff.split(/(?=^diff --git )/m);
      for (const hunk of hunks) {
        const fileMatch = hunk.match(/^diff --git a\/(.*?) b\//m);
        if (!fileMatch) continue;
        if (!cliFiles.includes(fileMatch[1])) continue;
        const diffHunk = extractDiffLines(hunk, optionRe);
        if (diffHunk) {
          results.push({ file: fileMatch[1], pattern: 'new CLI option or subcommand added', diffHunk });
        }
      }
      return results;
    },
  },

  {
    name: 'config-change',
    severity: 'medium',
    category: 'config-change',
    run(commit) {
      const configFiles = commit.changedFiles.filter((f) =>
        /config\.(ts|js|json)$|\/config\/types\.ts$|\.env(\.example)?$|tsconfig.*\.json$/.test(f),
      );
      return configFiles.map((f) => ({ file: f, pattern: 'config or environment file changed' }));
    },
  },

  {
    name: 'schema-change',
    severity: 'high',
    category: 'schema-change',
    run(commit) {
      const schemaFiles = commit.changedFiles.filter((f) =>
        /migration|schema|prisma|\.sql$/i.test(f),
      );
      return schemaFiles.map((f) => ({ file: f, pattern: 'schema or migration file changed' }));
    },
  },

  {
    name: 'new-feature',
    severity: 'medium',
    category: 'new-feature',
    run(commit) {
      if (commit.category !== 'feat') return [];
      if (commit.diffStat.insertions < 20) return [];
      const file = commit.changedFiles.find(isSignificantFile) ?? commit.changedFiles[0] ?? '(unknown)';
      return [{ file, pattern: `new feature with ${commit.diffStat.insertions} added lines` }];
    },
  },

  {
    name: 'public-api-entry',
    severity: 'medium',
    category: 'new-api',
    run(commit) {
      if (commit.category !== 'feat') return [];
      const entryFiles = commit.changedFiles.filter(
        (f) => /^(src\/)?index\.(ts|js)$|^lib\/index\.(ts|js)$/.test(f),
      );
      return entryFiles.map((f) => ({ file: f, pattern: 'feature commit touched public entry point' }));
    },
  },
];

function signalKey(sha: string, file: string): string {
  return `${sha}::${file}`;
}

export function detectDocSignals(commits: NormalizedCommit[]): DocSignal[] {
  const seen = new Map<string, DocTaskSeverity>();
  const signals: DocSignal[] = [];

  const severityRank: Record<DocTaskSeverity, number> = { high: 3, medium: 2, low: 1 };

  for (const commit of commits) {
    for (const rule of RULES) {
      const matches = rule.run(commit);
      for (const match of matches) {
        const key = signalKey(commit.sha, match.file);
        const existing = seen.get(key);

        if (existing && severityRank[existing] >= severityRank[rule.severity]) continue;

        seen.set(key, rule.severity);

        // Replace existing lower-severity signal for same key
        const idx = signals.findIndex((s) => signalKey(s.commitSha, s.triggerFile) === key);
        const signal: DocSignal = {
          commitSha: commit.sha,
          commitMessage: commit.message,
          triggerFile: match.file,
          triggerPattern: match.pattern,
          category: rule.category,
          severity: rule.severity,
          diffHunk: match.diffHunk,
        };
        if (idx >= 0) {
          signals[idx] = signal;
        } else {
          signals.push(signal);
        }
      }
    }
  }

  // Sort: high → medium → low
  return signals.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}
