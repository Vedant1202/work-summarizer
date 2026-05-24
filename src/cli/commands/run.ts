import { execSync } from 'child_process';
import { loadConfig } from '../../config/loader';
import { SummaryLength, OutputFormat } from '../../config/types';
import { ingestCommits } from '../../git/ingestion';
import { normalizeDiff } from '../../git/normalizer';
import { createProvider } from '../../llm/loader';
import { summarizeCommits } from '../../llm/prompts';
import { generateReport } from '../../report/generator';
import { exportReport } from '../../report/exporter';
import { openInEditor } from '../review';
import { extractIssueRefs, extractIssueRefsFromBranch } from '../../integrations/extractor';
import { LinearIntegrationClient } from '../../integrations/linear/client';
import { EnrichedCommit, TicketGroup } from '../../integrations/types';
import { NormalizedCommit } from '../../git/normalizer';
import { detectDocSignals } from '../../docs/detector';

interface RunOptions {
  since?: string;
  branch?: string;
  repo?: string;
  length?: string;
  format?: string;
  edit: boolean;
  withLinear: boolean;
}

function currentBranchName(repoPath: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function buildTicketGroups(enriched: EnrichedCommit[]): TicketGroup[] {
  const groups = new Map<string, TicketGroup>();

  for (const commit of enriched) {
    if (commit.linearIssues.length > 0) {
      for (const issue of commit.linearIssues) {
        const existing = groups.get(issue.identifier);
        if (existing) {
          existing.commits.push(commit);
        } else {
          groups.set(issue.identifier, {
            identifier: issue.identifier,
            title: issue.title,
            url: issue.url,
            status: issue.status,
            priority: issue.priority,
            cycleNumber: issue.cycleNumber,
            cycleTitle: issue.cycleTitle,
            commits: [commit],
          });
        }
      }
    } else {
      const unlinked = groups.get('Unlinked');
      if (unlinked) {
        unlinked.commits.push(commit);
      } else {
        groups.set('Unlinked', {
          identifier: 'Unlinked',
          title: 'Unlinked commits',
          commits: [commit],
        });
      }
    }
  }

  // Unlinked last
  const result: TicketGroup[] = [];
  for (const [id, group] of groups) {
    if (id !== 'Unlinked') result.push(group);
  }
  const unlinked = groups.get('Unlinked');
  if (unlinked) result.push(unlinked);
  return result;
}

async function enrichWithLinear(
  normalized: NormalizedCommit[],
  apiKey: string,
  repoPath: string,
): Promise<{ enriched: EnrichedCommit[]; ticketGroups: TicketGroup[] }> {
  const client = new LinearIntegrationClient(apiKey);
  const branchName = currentBranchName(repoPath);
  const branchRefs = branchName ? extractIssueRefsFromBranch(branchName) : [];
  const branchLinearIds = branchRefs.filter((r) => r.type === 'linear').map((r) => r.identifier);

  // Collect all unique Linear identifiers across commits + branch
  const allIds = new Set<string>(branchLinearIds);
  const commitRefs = normalized.map((c) => extractIssueRefs(c.message));
  for (const refs of commitRefs) {
    for (const ref of refs) {
      if (ref.type === 'linear') allIds.add(ref.identifier);
    }
  }

  if (allIds.size === 0) {
    const enriched = normalized.map((c) => ({ ...c, issueRefs: [], linearIssues: [] }));
    return { enriched, ticketGroups: buildTicketGroups(enriched) };
  }

  const issueMap = await client.fetchIssues(Array.from(allIds));

  const enriched: EnrichedCommit[] = normalized.map((c, i) => {
    const refs = commitRefs[i];
    const linearRefs = refs.filter((r) => r.type === 'linear');
    const linearIssues = linearRefs
      .map((r) => issueMap.get(r.identifier))
      .filter((issue): issue is NonNullable<typeof issue> => issue !== undefined);
    return { ...c, issueRefs: refs, linearIssues };
  });

  return { enriched, ticketGroups: buildTicketGroups(enriched) };
}

export async function runCommand(options: RunOptions): Promise<void> {
  const config = loadConfig();

  // Apply CLI overrides
  if (options.since) config.timeWindow = options.since;
  if (options.branch) config.branch = options.branch;
  if (options.repo) config.repoPath = options.repo;
  if (options.length) config.llm.summaryLength = options.length as SummaryLength;

  const format = (options.format ?? config.output.format ?? 'markdown') as OutputFormat;

  console.log(`Scanning commits on branch "${config.branch}" since ${config.timeWindow}...`);
  const commits = ingestCommits(config, { since: config.timeWindow, branch: config.branch });

  if (commits.length === 0) {
    console.log('No commits found in the specified time window.');
    process.exit(0);
  }

  console.log(`Found ${commits.length} commit(s). Normalizing diffs...`);
  const normalized = normalizeDiff(commits, config);

  console.log(`Summarizing with ${config.llm.model ?? config.llm.provider ?? 'gemini'} (${config.llm.summaryLength})...`);
  const provider = createProvider(config.llm);

  const humanCommits = normalized.filter((c) => !c.isAgentAssisted);
  const agentCommits = normalized.filter((c) => c.isAgentAssisted);

  if (agentCommits.length > 0) {
    console.log(`Detected ${agentCommits.length} agent-assisted commit(s) — generating separate summaries...`);
  }

  const summary = await summarizeCommits(
    provider,
    humanCommits.length > 0 ? humanCommits : normalized,
    config.llm.summaryLength,
    config.llm.promptTemplate,
  );

  const agentSummary = agentCommits.length > 0
    ? await summarizeCommits(
        provider,
        agentCommits,
        config.llm.summaryLength,
        config.llm.promptTemplate,
        'These commits were made with AI agent assistance.',
      )
    : undefined;

  let ticketGroups: TicketGroup[] | undefined;
  if (options.withLinear) {
    const linearKey = config.integrations?.linear?.apiKey;
    if (!linearKey) {
      console.warn('Warning: --with-linear set but LINEAR_API_KEY is not configured. Skipping Linear enrichment.');
      console.warn('  Set it via: export LINEAR_API_KEY=<key>  or  work-summary config set integrations.linear.apiKey <key>');
    } else {
      console.log('Fetching Linear issue data...');
      try {
        const result = await enrichWithLinear(normalized, linearKey, config.repoPath);
        ticketGroups = result.ticketGroups;
        const linked = ticketGroups.filter((g) => g.identifier !== 'Unlinked').length;
        console.log(`Linked commits to ${linked} Linear issue(s).`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Warning: Linear enrichment failed (${message}). Continuing without issue data.`);
      }
    }
  }

  const docSignals = detectDocSignals(normalized);

  let report = generateReport(normalized, summary, config, ticketGroups, docSignals.length > 0 ? docSignals : undefined, agentSummary);

  if (options.edit) {
    console.log('Opening in editor for review...');
    try {
      const editedContent = await openInEditor(report.content);
      report = { ...report, content: editedContent };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Skipping export: ${message}`);
      process.exit(1);
    }
  }

  const outputPaths = exportReport(report, config, format);
  for (const p of outputPaths) {
    console.log(`Report saved to: ${p}`);
  }
}
