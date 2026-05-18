import { describe, it, expect } from 'vitest';
import { extractIssueRefs, extractIssueRefsFromBranch } from './extractor';

describe('extractIssueRefs', () => {
  it('parses a plain Linear ID', () => {
    const refs = extractIssueRefs('ENG-123');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ identifier: 'ENG-123', type: 'linear' });
    expect(refs[0].closingKeyword).toBeUndefined();
  });

  it('parses a closing keyword + Linear ID', () => {
    const refs = extractIssueRefs('Fixes ENG-456');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ identifier: 'ENG-456', type: 'linear', closingKeyword: 'fixes' });
  });

  it('parses multiple variants in one message', () => {
    const refs = extractIssueRefs('Fixes ENG-123, see also ENG-456 and closes #42');
    const ids = refs.map((r) => r.identifier);
    expect(ids).toContain('ENG-123');
    expect(ids).toContain('ENG-456');
    expect(ids).toContain('#42');
  });

  it('deduplicates: closing-keyword ref wins over plain ref for same identifier', () => {
    const refs = extractIssueRefs('Fixes ENG-123 related to ENG-123');
    const engRefs = refs.filter((r) => r.identifier === 'ENG-123');
    expect(engRefs).toHaveLength(1);
    expect(engRefs[0].closingKeyword).toBe('fixes');
  });

  it('parses GitHub-style issue number', () => {
    const refs = extractIssueRefs('Closes #99');
    const gh = refs.find((r) => r.type === 'github');
    expect(gh?.identifier).toBe('#99');
  });

  it('returns empty array for plain commit message', () => {
    expect(extractIssueRefs('chore: update dependencies')).toHaveLength(0);
  });
});

describe('extractIssueRefsFromBranch', () => {
  it('extracts Linear ID from feature branch name', () => {
    const refs = extractIssueRefsFromBranch('feature/ENG-123-add-oauth');
    expect(refs.map((r) => r.identifier)).toContain('ENG-123');
  });

  it('extracts Linear ID from slash-prefixed branch', () => {
    const refs = extractIssueRefsFromBranch('ENG-456/fix-bug');
    expect(refs.map((r) => r.identifier)).toContain('ENG-456');
  });

  it('returns empty for a branch with no issue ref', () => {
    expect(extractIssueRefsFromBranch('main')).toHaveLength(0);
  });
});
