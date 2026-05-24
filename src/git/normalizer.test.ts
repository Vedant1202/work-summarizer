import { describe, it, expect } from 'vitest';
import { categorizeCommit, normalizeDiff, classifyAgent } from './normalizer';
import { Commit } from './ingestion';

describe('categorizeCommit', () => {
  it.each([
    ['feat: add login', 'feat'],
    ['feat(auth): add login', 'feat'],
    ['fix: null check', 'fix'],
    ['fix(api)!: breaking change', 'fix'],
    ['refactor: extract helper', 'refactor'],
    ['docs: update README', 'docs'],
    ['chore: bump deps', 'chore'],
    ['perf: cache query results', 'perf'],
    ['test: add unit tests', 'test'],
  ])('categorizes "%s" as %s', (message, expected) => {
    expect(categorizeCommit(message)).toBe(expected);
  });

  it('falls back to keyword matching for non-conventional commits', () => {
    expect(categorizeCommit('add new payment flow')).toBe('feat');
    expect(categorizeCommit('fix broken search query')).toBe('fix');
    expect(categorizeCommit('optimize database queries')).toBe('perf');
  });

  it('returns other for unrecognized messages', () => {
    expect(categorizeCommit('random message without hints')).toBe('other');
    expect(categorizeCommit('WIP')).toBe('other');
  });
});

describe('normalizeDiff', () => {
  function makeCommit(overrides: Partial<Commit> = {}): Commit {
    return {
      sha: 'abc1234',
      author: 'Test User',
      timestamp: '2024-01-01T00:00:00Z',
      message: 'feat: test commit',
      coAuthors: [],
      changedFiles: ['src/index.ts'],
      diffStat: { insertions: 10, deletions: 2 },
      rawDiff: 'diff --git a/src/index.ts b/src/index.ts\n+new line\n',
      ...overrides,
    };
  }

  it('assigns a category to each commit', () => {
    const result = normalizeDiff([makeCommit({ message: 'fix: patch null ref' })]);
    expect(result[0].category).toBe('fix');
  });

  it('filters out lock files from changedFiles', () => {
    const commit = makeCommit({ changedFiles: ['src/index.ts', 'package-lock.json'] });
    const result = normalizeDiff([commit]);
    expect(result[0].changedFiles).not.toContain('package-lock.json');
    expect(result[0].changedFiles).toContain('src/index.ts');
  });

  it('excludes commits that only touch excluded paths', () => {
    const commit = makeCommit({ changedFiles: ['dist/bundle.js'] });
    const result = normalizeDiff([commit], { focusAreas: ['src/'] });
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeDiff([])).toHaveLength(0);
  });

  it('marks agent-assisted commits and passes isAgentAssisted through normalization', () => {
    const commit = makeCommit({ coAuthors: ['noreply@anthropic.com'] });
    const result = normalizeDiff([commit]);
    expect(result[0].isAgentAssisted).toBe(true);
    expect(result[0].agentName).toBe('Claude Code');
  });

  it('marks human commits as not agent-assisted', () => {
    const commit = makeCommit();
    const result = normalizeDiff([commit]);
    expect(result[0].isAgentAssisted).toBe(false);
    expect(result[0].agentName).toBeUndefined();
  });
});

describe('classifyAgent', () => {
  function makeBaseCommit(overrides: Partial<Commit> = {}): Commit {
    return {
      sha: 'abc1234',
      author: 'Dev User',
      timestamp: '2024-01-01T00:00:00Z',
      message: 'test commit',
      coAuthors: [],
      changedFiles: [],
      diffStat: { insertions: 0, deletions: 0 },
      rawDiff: '',
      ...overrides,
    };
  }

  it.each([
    ['noreply@anthropic.com', 'Claude Code'],
    ['noreply@github.com', 'GitHub Copilot'],
    ['noreply@cursor.com', 'Cursor'],
    ['noreply@openai.com', 'Codex'],
  ])('detects %s as %s via Co-Authored-By email', (email, expectedAgent) => {
    const commit = makeBaseCommit({ coAuthors: [email] });
    const result = classifyAgent(commit);
    expect(result.isAgentAssisted).toBe(true);
    expect(result.agentName).toBe(expectedAgent);
  });

  it('detects Aider via author name suffix', () => {
    const commit = makeBaseCommit({ author: 'vedant (aider)' });
    const result = classifyAgent(commit);
    expect(result.isAgentAssisted).toBe(true);
    expect(result.agentName).toBe('Aider');
  });

  it('returns false for a regular human commit with no co-authors', () => {
    const commit = makeBaseCommit();
    const result = classifyAgent(commit);
    expect(result.isAgentAssisted).toBe(false);
    expect(result.agentName).toBeUndefined();
  });

  it('returns false for an unknown co-author email', () => {
    const commit = makeBaseCommit({ coAuthors: ['bot@someunknownservice.com'] });
    const result = classifyAgent(commit);
    expect(result.isAgentAssisted).toBe(false);
    expect(result.agentName).toBeUndefined();
  });

  it('handles uppercase email domains case-insensitively', () => {
    const commit = makeBaseCommit({ coAuthors: ['noreply@ANTHROPIC.COM'] });
    const result = classifyAgent(commit);
    expect(result.isAgentAssisted).toBe(true);
    expect(result.agentName).toBe('Claude Code');
  });
});
