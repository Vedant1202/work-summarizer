import path from 'path';
import fs from 'fs';
import os from 'os';
import { Command } from 'commander';
import { runCommand } from './commands/run';
import { exportCommand } from './commands/export';
import { configShowCommand, configGetCommand, configSetCommand, configInitCommand } from './commands/config';
import { historyCommand } from './commands/history';
import { scheduleCommand } from './commands/schedule';
import { docsCommand } from './commands/docs';
import { loadConfig } from '../config/loader';
import { exportDocTasks, pushToDocsRepo } from '../docs/exporter';

const program = new Command();

program
  .name('daily-summary')
  .description('Generate daily stand-up summaries from git commits')
  .version('0.1.0');

program
  .command('run')
  .description('Scan commits and generate a stand-up summary')
  .option('--since <duration>', 'time window, e.g. 24h, 2d, 1w', '24h')
  .option('--branch <name>', 'git branch to scan (defaults to config)')
  .option('--length <size>', 'summary length: short, medium, long', 'medium')
  .option('--format <fmt>', 'output format: markdown, html, both', 'markdown')
  .option('--no-edit', 'skip editor review and export directly')
  .option('--with-linear', 'enrich report with Linear issue data (requires LINEAR_API_KEY)')
  .action(async (options) => {
    await runCommand({
      since: options.since,
      branch: options.branch,
      length: options.length,
      format: options.format,
      edit: options.edit !== false,
      withLinear: options.withLinear === true,
    });
  });

program
  .command('export')
  .description('Re-export or view the last generated report')
  .option('--date <date>', 'target a specific report by date (YYYY-MM-DD)')
  .option('--open', 'open the report in $EDITOR')
  .action(async (options) => {
    await exportCommand({ date: options.date, open: options.open });
  });

const configCmd = program
  .command('config')
  .description('View or modify configuration');

configCmd
  .command('init')
  .description('Interactive setup wizard — saves API keys to ~/.daily-summary/.env')
  .action(async () => { await configInitCommand(); });

configCmd
  .command('show')
  .description('Print the current merged config (API key masked)')
  .action(() => configShowCommand());

configCmd
  .command('get <key>')
  .description('Get a config value by dot-path (e.g. llm.model)')
  .action((key) => configGetCommand(key));

configCmd
  .command('set <key> <value>')
  .description('Set a config value in the repo-local config')
  .option('--global', 'write to global config instead of repo-local')
  .action((key, value, options) => configSetCommand(key, value, options));

program
  .command('history')
  .description('List all saved reports')
  .option('--open <date>', 'open report for a specific date in $EDITOR')
  .option('--last', 'open the most recent report in $EDITOR')
  .action(async (options) => {
    await historyCommand({ open: options.open, last: options.last });
  });

const docsCmd = program
  .command('docs')
  .description('Detect and review documentation tasks from recent commits')
  .option('--since <duration>', 'time window, e.g. 24h, 2d, 1w', '24h')
  .option('--branch <name>', 'git branch to analyze')
  .option('--no-review', 'skip interactive review and accept all detected tasks')
  .option('--format <fmt>', 'export format: markdown, json, both', 'markdown')
  .option('--no-llm', 'use template-based task descriptions instead of LLM')
  .option('--create-issues', 'prompt to create a Linear issue for each accepted task (requires LINEAR_API_KEY and team ID)')
  .action(async (options) => {
    await docsCommand({
      since: options.since,
      branch: options.branch,
      review: options.review !== false,
      format: options.format,
      llm: options.llm !== false,
      createIssues: options.createIssues === true,
    });
  });

docsCmd
  .command('push')
  .description('Push saved doc tasks to a local docs repository')
  .option('--date <YYYY-MM-DD>', 'target a specific date (defaults to today)')
  .option('--repo <name>', 'repo name used in the filename (defaults to current directory name)')
  .option('--path <docs-repo>', 'path to the docs repository (overrides config)')
  .option('--auto-commit', 'auto git-commit after writing (overrides config)')
  .action(async (options) => {
    const config = loadConfig();
    const date = options.date ?? new Date().toISOString().split('T')[0];
    const repoName = options.repo ?? path.basename(path.resolve(config.repoPath));

    if (options.path) {
      if (!config.integrations) config.integrations = {};
      if (!config.integrations.docsRepo) config.integrations.docsRepo = {};
      config.integrations.docsRepo.path = options.path;
    }
    if (options.autoCommit) {
      if (!config.integrations) config.integrations = {};
      if (!config.integrations.docsRepo) config.integrations.docsRepo = {};
      config.integrations.docsRepo.autoCommit = true;
    }

    const docsRepoConfig = config.integrations?.docsRepo ?? {};

    // Find the doc-tasks file for the given date
    const docTasksDir = path.join(os.homedir(), '.daily-summary', 'doc-tasks');
    const mdFile = path.join(docTasksDir, `${date}-${repoName}.md`);
    const jsonFile = path.join(docTasksDir, `${date}-${repoName}.json`);

    let tasks: import('../docs/types').DocTask[] = [];
    if (fs.existsSync(jsonFile)) {
      try {
        tasks = JSON.parse(fs.readFileSync(jsonFile, 'utf8')) as import('../docs/types').DocTask[];
      } catch {
        console.error(`Failed to parse ${jsonFile}`);
        process.exit(1);
      }
    } else if (fs.existsSync(mdFile)) {
      // No JSON — generate a synthetic accepted task list to push the Markdown file
      tasks = [];
    } else {
      console.error(`No doc-tasks file found for ${date}/${repoName}.`);
      console.error(`Run 'daily-summary docs' first to generate tasks.`);
      process.exit(1);
    }

    // If we only have Markdown (no JSON), push it directly
    if (!fs.existsSync(jsonFile) && fs.existsSync(mdFile)) {
      const repoPath = path.resolve(docsRepoConfig.path ?? '');
      if (!docsRepoConfig.path || !fs.existsSync(repoPath)) {
        console.error('Docs repo path is not set or does not exist.');
        console.error('  daily-summary config set integrations.docsRepo.path /path/to/docs-repo');
        process.exit(1);
      }
      const outputSubdir = docsRepoConfig.outputDir ?? 'doc-tasks';
      const outputDir = path.join(repoPath, outputSubdir);
      fs.mkdirSync(outputDir, { recursive: true });
      const dest = path.join(outputDir, `${date}-${repoName}.md`);
      fs.copyFileSync(mdFile, dest);
      console.log(`Doc tasks pushed to: ${dest}`);
      if (!docsRepoConfig.autoCommit) {
        console.log(`To commit: git -C "${repoPath}" add "${path.join(outputSubdir, `${date}-${repoName}.md`)}" && git -C "${repoPath}" commit -m "docs: add doc tasks from ${repoName} ${date}"`);
      }
      return;
    }

    try {
      const dest = pushToDocsRepo(tasks, repoName, date, docsRepoConfig);
      console.log(`Doc tasks pushed to: ${dest}`);
      if (!docsRepoConfig.autoCommit) {
        const repoPath = path.resolve(docsRepoConfig.path!);
        const outputSubdir = docsRepoConfig.outputDir ?? 'doc-tasks';
        console.log(`To commit: git -C "${repoPath}" add "${path.join(outputSubdir, `${date}-${repoName}.md`)}" && git -C "${repoPath}" commit -m "docs: add doc tasks from ${repoName} ${date}"`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command('schedule')
  .description('Set up automated daily report generation')
  .option('--time <HH:MM>', 'time to run each day (default: 08:00)', '08:00')
  .option('--remove', 'remove the scheduled job')
  .action((options) => {
    scheduleCommand({ time: options.time, remove: options.remove });
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
