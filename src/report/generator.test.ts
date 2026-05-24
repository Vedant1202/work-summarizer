import { describe, it, expect } from 'vitest';
import { generateReport, buildTicketSection } from './generator';
import { NormalizedCommit } from '../git/normalizer';
import { TicketGroup, EnrichedCommit } from '../integrations/types';
import { Config } from '../config/types';

function makeCommit(overrides: Partial<NormalizedCommit> = {}): NormalizedCommit {
  return {
    sha: 'abc1234def5678',
    author: 'Test',
    timestamp: '2024-01-01T00:00:00Z',
    message: 'feat: add login',
    changedFiles: ['src/auth.ts'],
    diffStat: { insertions: 10, deletions: 2 },
    diff: '',
    diffTruncated: false,
    category: 'feat',
    isAgentAssisted: false,
    ...overrides,
  };
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    repoPath: '/tmp/repo',
    branch: 'main',
    timeWindow: '24h',
    llm: { summaryLength: 'medium' },
    output: { dir: '/tmp/reports' },
    ...overrides,
  };
}

describe('generateReport', () => {
  it('produces a report with expected fields', () => {
    const report = generateReport([makeCommit()], 'Test summary', makeConfig());
    expect(report.commitCount).toBe(1);
    expect(report.branch).toBe('main');
    expect(report.content).toContain('Daily Stand-up');
    expect(report.content).toContain('Test summary');
    expect(report.content).toContain('feat: add login');
  });

  it('does not include By Issue section when ticketGroups is undefined', () => {
    const report = generateReport([makeCommit()], 'Summary', makeConfig());
    expect(report.content).not.toContain('## By Issue');
    expect(report.ticketGroups).toBeUndefined();
  });

  it('includes By Issue section when ticketGroups is provided', () => {
    const commit = makeCommit() as EnrichedCommit;
    commit.issueRefs = [];
    commit.linearIssues = [];
    const group: TicketGroup = {
      identifier: 'ENG-1',
      title: 'Test issue',
      url: 'https://linear.app/test/issue/ENG-1',
      status: 'In Progress',
      priority: 2,
      commits: [commit],
    };
    const report = generateReport([makeCommit()], 'Summary', makeConfig(), [group]);
    expect(report.content).toContain('## By Issue');
    expect(report.content).toContain('ENG-1: Test issue');
    expect(report.ticketGroups).toHaveLength(1);
  });
});

describe('buildTicketSection', () => {
  it('renders issue identifier, title, and commit', () => {
    const commit = makeCommit() as EnrichedCommit;
    commit.issueRefs = [];
    commit.linearIssues = [];
    const group: TicketGroup = {
      identifier: 'ENG-42',
      title: 'My feature',
      commits: [commit],
    };
    const md = buildTicketSection([group]);
    expect(md).toContain('ENG-42: My feature');
    expect(md).toContain('feat: add login');
    expect(md).toContain('+10/-2');
  });

  it('includes status and priority in heading when provided', () => {
    const commit = makeCommit() as EnrichedCommit;
    commit.issueRefs = [];
    commit.linearIssues = [];
    const group: TicketGroup = {
      identifier: 'ENG-5',
      title: 'Fix bug',
      status: 'Done',
      priority: 2,
      commits: [commit],
    };
    const md = buildTicketSection([group]);
    expect(md).toContain('Done');
    expect(md).toContain('High');
  });

  it('renders a URL as a Markdown link', () => {
    const commit = makeCommit() as EnrichedCommit;
    commit.issueRefs = [];
    commit.linearIssues = [];
    const group: TicketGroup = {
      identifier: 'ENG-7',
      title: 'Linked issue',
      url: 'https://linear.app/org/issue/ENG-7',
      commits: [commit],
    };
    const md = buildTicketSection([group]);
    expect(md).toContain('[ENG-7: Linked issue](https://linear.app/org/issue/ENG-7)');
  });
});
