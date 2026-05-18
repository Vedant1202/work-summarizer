import { Command } from 'commander';

const program = new Command();

program
  .name('daily-summary')
  .description('Generate daily stand-up summaries from git commits')
  .version('0.1.0');

program
  .command('run')
  .description('Scan commits and generate a stand-up summary')
  .option('--since <duration>', 'time window, e.g. 24h, 2d, 1w', '24h')
  .option('--branch <name>', 'git branch to scan (defaults to current branch)')
  .option('--length <size>', 'summary length: short, medium, long', 'medium')
  .option('--no-edit', 'skip editor review and export directly')
  .action(async (_options) => {
    console.log('run command — not yet implemented');
  });

program
  .command('export')
  .description('Re-export or view the last generated report')
  .option('--date <date>', 'target a specific report by date (YYYY-MM-DD)')
  .option('--open', 'open the report in $EDITOR')
  .action(async (_options) => {
    console.log('export command — not yet implemented');
  });

const configCmd = program
  .command('config')
  .description('View or modify configuration');

configCmd
  .command('show')
  .description('Print the current merged config')
  .action(() => {
    console.log('config show — not yet implemented');
  });

configCmd
  .command('get <key>')
  .description('Get a config value by dot-path (e.g. llm.model)')
  .action((_key) => {
    console.log('config get — not yet implemented');
  });

configCmd
  .command('set <key> <value>')
  .description('Set a config value (e.g. llm.model gemini-2.0-flash-lite)')
  .action((_key, _value) => {
    console.log('config set — not yet implemented');
  });

program.parse(process.argv);
