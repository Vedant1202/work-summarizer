import { SummaryLength } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';

const LENGTH_INSTRUCTIONS: Record<SummaryLength, string> = {
  short: 'Write 3–5 concise bullet points. Each bullet should be one short sentence.',
  medium:
    'Write a short paragraph (4–6 sentences) grouping related changes, followed by a bullet list of key highlights.',
  long: 'Write a detailed breakdown: an opening paragraph, then categorized sections (Features, Fixes, Refactors, Docs/Chores) each with bullet points. Include file-level detail where meaningful.',
};

function formatCommit(c: NormalizedCommit): string {
  const files = c.changedFiles.length > 0 ? `\nFiles: ${c.changedFiles.join(', ')}` : '';
  const stats = `+${c.diffStat.insertions}/-${c.diffStat.deletions}`;
  const diff = c.diff ? `\n--- diff ---\n${c.diff}\n--- end diff ---` : '';
  return `Commit ${c.sha.slice(0, 7)} by ${c.author} at ${c.timestamp}\n${c.message} (${stats})${files}${diff}`;
}

export function buildSummarizationPrompt(commits: NormalizedCommit[], length: SummaryLength): string {
  const commitBlock = commits.map(formatCommit).join('\n\n');

  return `You are a technical writer helping a software developer write a daily stand-up summary from their recent git commits.

${LENGTH_INSTRUCTIONS[length]}

Guidelines:
- Focus on WHAT changed and WHY it matters, not HOW it was implemented
- Group related commits together
- Use plain language — avoid jargon and implementation minutiae
- Do not include the commit SHA or author in the output
- If there are no meaningful changes, say so briefly

Here are the commits from the past day:

${commitBlock}

Write the stand-up summary now:`;
}
