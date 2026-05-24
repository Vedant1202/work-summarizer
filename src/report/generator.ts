import path from 'path';
import { Config, CommitCategory } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';
import { TicketGroup } from '../integrations/types';
import { DocSignal } from '../docs/types';

export interface Report {
  date: string;
  repoName: string;
  branch: string;
  timeWindow: string;
  commitCount: number;
  summary: string;
  commits: NormalizedCommit[];
  humanCommits: NormalizedCommit[];
  agentCommits: NormalizedCommit[];
  humanSummary?: string;
  agentSummary?: string;
  ticketGroups?: TicketGroup[];
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

const PRIORITY_LABELS: Record<number, string> = {
  0: 'No priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export function buildTicketSection(groups: TicketGroup[]): string {
  const sections = groups.map((group) => {
    const meta: string[] = [];
    if (group.status) meta.push(group.status);
    if (group.priority !== undefined) meta.push(PRIORITY_LABELS[group.priority] ?? `P${group.priority}`);
    const metaSuffix = meta.length > 0 ? ` _(${meta.join(' · ')})_` : '';
    const heading = group.url
      ? `### [${group.identifier}: ${group.title}](${group.url})${metaSuffix}`
      : `### ${group.identifier}: ${group.title}${metaSuffix}`;

    const items = group.commits
      .map((c) => {
        const stat = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
        return `- \`${c.sha.slice(0, 7)}\` ${c.message} (${stat})`;
      })
      .join('\n');

    return `${heading}\n${items}`;
  });

  return sections.join('\n\n');
}

const SEVERITY_BADGE: Record<string, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

function buildDocsImpactSection(signals: DocSignal[], mintlifyConfigured: boolean): string {
  if (signals.length === 0) return '';

  const rows = signals.map((s) => {
    const badge = SEVERITY_BADGE[s.severity] ?? s.severity.toUpperCase();
    const file = `\`${s.triggerFile}\``;
    return `| ${badge} | ${s.category} | ${file} | ${s.triggerPattern} |`;
  });

  const cta = mintlifyConfigured
    ? 'Run `work-summary mintlify trigger` to deploy.'
    : 'Run `work-summary docs` for a full interactive review.';

  return `\n---\n\n## Docs Impact\n\n_${signals.length} area${signals.length !== 1 ? 's' : ''} may need documentation updates._\n\n| Severity | Category | File | Signal |\n|----------|----------|------|--------|\n${rows.join('\n')}\n\n> ${cta}\n`;
}

function buildMarkdown(
  date: string,
  repoName: string,
  branch: string,
  timeWindow: string,
  commits: NormalizedCommit[],
  summary: string,
  ticketGroups?: TicketGroup[],
  docSignals?: DocSignal[],
  mintlifyConfigured?: boolean,
  agentSummary?: string,
): string {
  const ticketSection = ticketGroups && ticketGroups.length > 0
    ? `\n---\n\n## By Issue\n\n${buildTicketSection(ticketGroups)}\n`
    : '';

  const docsImpactSection = docSignals && docSignals.length > 0
    ? buildDocsImpactSection(docSignals, mintlifyConfigured ?? false)
    : '';

  const humanCommits = commits.filter((c) => !c.isAgentAssisted);
  const agentCommits = commits.filter((c) => c.isAgentAssisted);
  const hasTwoSections = agentSummary !== undefined && agentCommits.length > 0;

  const summarySection = hasTwoSections
    ? `## 👤 Human Commits\n\n${summary}\n\n---\n\n## 🤖 Agent-Assisted Commits\n\n${agentSummary}`
    : `## Summary\n\n${summary}`;

  const commitsSection = hasTwoSections
    ? `## Human Commits by Category\n\n${buildCommitsByCategory(humanCommits)}\n\n---\n\n## Agent-Assisted Commits by Category\n\n${buildCommitsByCategory(agentCommits)}`
    : `## Commits by Category\n\n${buildCommitsByCategory(commits)}`;

  return `# Daily Stand-up — ${date}

**Repo:** ${repoName} | **Branch:** ${branch} | **Period:** last ${timeWindow} | **Commits:** ${commits.length}

---

${summarySection}

---

${commitsSection}
${ticketSection}${docsImpactSection}`.trim() + '\n';
}

export function generateReport(
  commits: NormalizedCommit[],
  summary: string,
  config: Config,
  ticketGroups?: TicketGroup[],
  docSignals?: DocSignal[],
  agentSummary?: string,
): Report {
  const date = formatDate();
  const repoName = path.basename(path.resolve(config.repoPath));
  const mintlifyConfigured = !!(config.integrations?.mintlify?.apiKey && config.integrations?.mintlify?.projectId);

  const humanCommits = commits.filter((c) => !c.isAgentAssisted);
  const agentCommits = commits.filter((c) => c.isAgentAssisted);

  const content = buildMarkdown(
    date,
    repoName,
    config.branch,
    config.timeWindow,
    commits,
    summary,
    ticketGroups,
    docSignals,
    mintlifyConfigured,
    agentSummary,
  );

  return {
    date,
    repoName,
    branch: config.branch,
    timeWindow: config.timeWindow,
    commitCount: commits.length,
    summary,
    commits,
    humanCommits,
    agentCommits,
    humanSummary: summary,
    agentSummary,
    ticketGroups,
    content,
  };
}
