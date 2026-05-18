import { loadConfig } from '../../config/loader';
import { SummaryLength, OutputFormat } from '../../config/types';
import { ingestCommits } from '../../git/ingestion';
import { normalizeDiff } from '../../git/normalizer';
import { GeminiProvider } from '../../llm/gemini';
import { generateReport } from '../../report/generator';
import { exportReport } from '../../report/exporter';
import { openInEditor } from '../review';

interface RunOptions {
  since?: string;
  branch?: string;
  length?: string;
  format?: string;
  edit: boolean;
}

export async function runCommand(options: RunOptions): Promise<void> {
  const config = loadConfig();

  // Apply CLI overrides
  if (options.since) config.timeWindow = options.since;
  if (options.branch) config.branch = options.branch;
  if (options.length) config.llm.summaryLength = options.length as SummaryLength;

  const format = (options.format ?? config.output.format ?? 'markdown') as OutputFormat;

  if (!config.llm.apiKey) {
    console.error('Error: GEMINI_API_KEY is not set. Export it as an environment variable or run:');
    console.error('  daily-summary config set llm.apiKey <your-key>');
    process.exit(1);
  }

  if (!config.llm.model) {
    console.error('Error: GEMINI_MODEL is not set. Export it as an environment variable or run:');
    console.error('  daily-summary config set llm.model <model-name>');
    process.exit(1);
  }

  console.log(`Scanning commits on branch "${config.branch}" since ${config.timeWindow}...`);
  const commits = ingestCommits(config, { since: config.timeWindow, branch: config.branch });

  if (commits.length === 0) {
    console.log('No commits found in the specified time window.');
    process.exit(0);
  }

  console.log(`Found ${commits.length} commit(s). Normalizing diffs...`);
  const normalized = normalizeDiff(commits, config);

  console.log(`Summarizing with ${config.llm.model} (${config.llm.summaryLength})...`);
  const provider = new GeminiProvider(config.llm.apiKey, config.llm.model);
  const summary = await provider.summarize(normalized, config.llm.summaryLength);

  let report = generateReport(normalized, summary, config);

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
