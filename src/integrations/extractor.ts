import { IssueRef } from './types';

const CLOSING_KEYWORDS = /(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?|complete[sd]?)/i;

// Closing keyword + Linear ID: "Fixes ENG-123"
const CLOSING_LINEAR_RE = new RegExp(
  `(${CLOSING_KEYWORDS.source})\\s+([A-Z]{2,10}-\\d+)`,
  'gi',
);

// Plain Linear ID mention: "ENG-123"
const PLAIN_LINEAR_RE = /\b([A-Z]{2,10}-\d+)\b/g;

// GitHub-style issue number: "#42"
const GITHUB_RE = /#(\d+)\b/g;

export function extractIssueRefs(text: string): IssueRef[] {
  const refs = new Map<string, IssueRef>();

  // Pass 1: closing keyword + Linear ID (higher priority)
  let match: RegExpExecArray | null;
  CLOSING_LINEAR_RE.lastIndex = 0;
  while ((match = CLOSING_LINEAR_RE.exec(text)) !== null) {
    const keyword = match[1].toLowerCase();
    const identifier = match[2].toUpperCase();
    refs.set(identifier, {
      raw: match[0],
      identifier,
      type: 'linear',
      closingKeyword: keyword,
    });
  }

  // Pass 2: plain Linear ID (only add if not already captured with a closing keyword)
  PLAIN_LINEAR_RE.lastIndex = 0;
  while ((match = PLAIN_LINEAR_RE.exec(text)) !== null) {
    const identifier = match[1].toUpperCase();
    if (!refs.has(identifier)) {
      refs.set(identifier, {
        raw: match[0],
        identifier,
        type: 'linear',
      });
    }
  }

  // Pass 3: GitHub-style numbers
  GITHUB_RE.lastIndex = 0;
  while ((match = GITHUB_RE.exec(text)) !== null) {
    const identifier = `#${match[1]}`;
    if (!refs.has(identifier)) {
      refs.set(identifier, {
        raw: match[0],
        identifier,
        type: 'github',
      });
    }
  }

  return Array.from(refs.values());
}

export function extractIssueRefsFromBranch(branchName: string): IssueRef[] {
  // Replace / and _ separators with spaces, but preserve - so ENG-123 stays intact
  return extractIssueRefs(branchName.replace(/[/_]/g, ' '));
}
