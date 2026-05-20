import fs from 'fs';
import os from 'os';
import path from 'path';
import Mustache from 'mustache';
import { SummaryLength, CommitCategory } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';
import { MintlifyDeployRecord } from '../integrations/mintlify/types';
import { LLMProvider } from './types';

// Embedded default template — avoids file-read issues in global npm installs
const DEFAULT_TEMPLATE = `{{{systemRules}}}

---

OUTPUT FORMAT:
{{{lengthInstructions}}}

---

COMMITS (pre-classified by type):

{{{commitBlock}}}

---

Write the stand-up summary now. Follow the format and rules above exactly.`;

// Category display labels (order defines section order in output)
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

const LENGTH_INSTRUCTIONS: Record<SummaryLength, string> = {
  short: `Write 3–5 bullet points covering only the most impactful changes (features and fixes first).
- Each bullet: max 80 characters
- One section maximum — no category headers
- Format: "• [Past-tense action] [brief impact if clear]"`,

  medium: `Write a grouped summary with section headers for each category that has commits.
- 2–4 bullets per populated section
- Each bullet: max 100 characters
- Sections appear in this order (omit empty ones): Features → Bug Fixes → Performance → Refactors & Improvements → Tests → Documentation → Chores & Maintenance
- Format each bullet: "- [Past-tense action] – [user/team impact, if discernible]"`,

  long: `Write a detailed grouped summary.
- Open with a 2-sentence "theme" paragraph summarizing the day's overall direction
- Then provide section headers for each category that has commits
- Up to 8 bullets per section; each bullet max 120 characters
- Include file-level detail (e.g., "in auth/provider.ts") where it adds context
- Sections in order: Features → Bug Fixes → Performance → Refactors & Improvements → Tests → Documentation → Chores & Maintenance
- Format each bullet: "- [Past-tense action] – [impact or detail]"`,
};

const SYSTEM_RULES = `You are a senior engineering writer generating a professional daily stand-up summary from git commit data.

VOICE & STYLE RULES (follow strictly):
- Use past-tense imperative voice: "Added X", "Fixed Y", "Improved Z" — NOT "Adding X" or "We added X"
- Be specific about what changed and why it matters; avoid vague language ("cleaned up code", "made improvements")
- Do not invent performance metrics, numbers, or impact claims that are not present in the commit messages or diffs
- Do not include commit SHAs, author names, or timestamps in the output
- Omit trivial commits: whitespace-only changes, lock file bumps, minor version pins with no feature impact
- If a commit message includes "BREAKING CHANGE" or "!", prefix that bullet with "⚠ BREAKING:"
- If a commit message mentions a blocker, dependency wait, or TODO, prefix that bullet with "🔴 BLOCKED:"
- Write for a technical audience (engineers and tech leads) — be precise but concise

QUALITY BAR:
- A reader should understand what shipped, what broke, and what improved in under 30 seconds
- Each bullet should be independently meaningful — no vague fillers
- Prioritize user-visible and system-visible impact over implementation details`;

function formatCommitForPrompt(c: NormalizedCommit): string {
  const stat = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
  const files = c.changedFiles.length > 0 ? ` → ${c.changedFiles.slice(0, 4).join(', ')}${c.changedFiles.length > 4 ? ', …' : ''}` : '';
  const diff = c.diff ? `\n  diff:\n${c.diff.split('\n').slice(0, 20).map((l) => '  ' + l).join('\n')}` : '';
  return `[${c.category}] ${c.message} (${stat})${files}${diff}`;
}

function groupCommitsByCategory(commits: NormalizedCommit[]): Map<CommitCategory, NormalizedCommit[]> {
  const groups = new Map<CommitCategory, NormalizedCommit[]>();
  for (const commit of commits) {
    const existing = groups.get(commit.category) ?? [];
    existing.push(commit);
    groups.set(commit.category, existing);
  }
  return groups;
}

export function buildSummarizationPrompt(commits: NormalizedCommit[], length: SummaryLength, templatePath?: string): string {
  const groups = groupCommitsByCategory(commits);

  const orderedSections = CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => {
      const label = CATEGORY_LABELS[cat];
      const items = groups.get(cat)!.map((c) => `  ${formatCommitForPrompt(c)}`).join('\n');
      return `### ${label}\n${items}`;
    })
    .join('\n\n');

  const commitBlock = orderedSections || commits.map((c) => formatCommitForPrompt(c)).join('\n');

  // Template view — exposes both pre-built strings and raw commit data
  const view = {
    systemRules: SYSTEM_RULES,
    lengthInstructions: LENGTH_INSTRUCTIONS[length],
    commitBlock,
    summaryLength: length,
    commitCount: commits.length,
    commits: commits.map((c) => ({
      sha7: c.sha.slice(0, 7),
      message: c.message,
      category: c.category,
      insertions: c.diffStat.insertions,
      deletions: c.diffStat.deletions,
      diff: c.diff,
      changedFiles: c.changedFiles,
    })),
  };

  let template = DEFAULT_TEMPLATE;
  if (templatePath) {
    const resolved = templatePath.replace(/^~/, os.homedir());
    template = fs.readFileSync(path.resolve(resolved), 'utf8');
  }

  return Mustache.render(template, view);
}

export async function summarizeCommits(
  provider: LLMProvider,
  commits: NormalizedCommit[],
  summaryLength: SummaryLength,
  templatePath?: string,
): Promise<string> {
  if (commits.length === 0) {
    return 'No commits found in the specified time window.';
  }
  const prompt = buildSummarizationPrompt(commits, summaryLength, templatePath);
  return provider.rawPrompt(prompt);
}

export function buildDeploymentSummaryPrompt(records: MintlifyDeployRecord[]): string {
  const hasFileData = records.some((r) => r.filesChanged);

  const deploymentBlocks = records.map((r, i) => {
    const date = r.triggeredAt.replace('T', ' ').slice(0, 16);
    const lines = [
      `[${i + 1}] ${date} — ${r.mode} deployment — branch: ${r.branch ?? 'unknown'} — status: ${r.finalStatus}`,
    ];
    if (r.commitSha) lines.push(`    Commit: ${r.commitSha.slice(0, 7)} "${r.commitMessage ?? ''}"`);
    if (r.filesChanged) {
      const { added, modified, removed } = r.filesChanged;
      lines.push(`    Files added:    ${added.join(', ') || 'none'}`);
      lines.push(`    Files modified: ${modified.join(', ') || 'none'}`);
      lines.push(`    Files removed:  ${removed.join(', ') || 'none'}`);
    } else {
      lines.push('    Files changed:  (not available — API-triggered deployments do not expose commit data)');
    }
    if (r.summary) lines.push(`    Mintlify status: "${r.summary}"`);
    if (r.subdomain) lines.push(`    Site: ${r.subdomain}`);
    return lines.join('\n');
  });

  const fileDataNote = hasFileData
    ? ''
    : `\nNote: File-level change data is unavailable for these deployments (Mintlify does not expose commit details for API-triggered builds). Summarize deployment activity instead — when docs were updated, on which branch, and how frequently.\n`;

  return `You are a technical documentation assistant. Summarize the following Mintlify documentation deployments.
${fileDataNote}
${deploymentBlocks.join('\n\n')}

---

${hasFileData
    ? `Write a concise bullet-point summary of what changed in the documentation.
Rules:
- Group related file changes together (e.g. all API reference changes in one bullet)
- Name specific files or sections where possible (drop path prefixes for readability)
- Use past tense: "Updated X", "Added Y", "Removed Z"
- Focus on what a reader of the docs would notice
- Max 8 bullets total
- No preamble — start directly with the first bullet`
    : `Write a concise bullet-point summary of the documentation deployment activity.
Rules:
- Summarize how many deployments happened, on which branch, and in what mode
- Note the time range and frequency (e.g. "4 preview deployments over 30 minutes")
- Mention the docs site or subdomain if available
- Use past tense
- Max 4 bullets
- No preamble — start directly with the first bullet`
  }`;
}
