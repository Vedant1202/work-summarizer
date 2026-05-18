import { Command } from 'commander';
import { runCommand } from './commands/run';
import { exportCommand } from './commands/export';
import { configShowCommand, configGetCommand, configSetCommand } from './commands/config';
import { historyCommand } from './commands/history';
import { scheduleCommand } from './commands/schedule';

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
  .action(async (options) => {
    await runCommand({
      since: options.since,
      branch: options.branch,
      length: options.length,
      format: options.format,
      edit: options.edit !== false,
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
