import readline from 'readline';
import fs from 'fs';
import { loadConfig, saveConfig, getNestedKey, maskConfig, writeEnvKey, GLOBAL_ENV_FILE } from '../../config/loader';
import { ConfigScope } from '../../config/types';

export function configShowCommand(): void {
  const config = loadConfig();
  const masked = maskConfig(config);
  console.log(JSON.stringify(masked, null, 2));
}

export function configGetCommand(key: string): void {
  const config = loadConfig();
  const value = getNestedKey(config, key);
  if (value === undefined) {
    console.error(`Key not found: ${key}`);
    process.exit(1);
  }
  console.log(String(value));
}

export function configSetCommand(key: string, value: string, options: { global?: boolean }): void {
  const scope: ConfigScope = options.global ? 'global' : 'local';
  saveConfig(scope, key, value);
  console.log(`Set ${key} = ${value} (${scope})`);
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function maskValue(value: string): string {
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}

function readExistingEnvKey(key: string): string {
  try {
    const content = fs.readFileSync(GLOBAL_ENV_FILE, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith(`${key}=`)) {
        return trimmed.slice(key.length + 1).replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // file doesn't exist
  }
  return '';
}

export async function configInitCommand(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error('config init requires an interactive terminal.');
    console.error('Set keys directly: export GEMINI_API_KEY=<key>  or  daily-summary config set llm.apiKey <key>');
    process.exit(1);
  }

  console.log('\nWelcome to daily-summary setup.\n');
  console.log(`Config will be saved to: ${GLOBAL_ENV_FILE}\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const fields: Array<{ key: string; label: string; required: boolean; default?: string }> = [
      { key: 'GEMINI_API_KEY', label: 'Gemini API key (https://aistudio.google.com/apikey)', required: true },
      { key: 'GEMINI_MODEL', label: 'Gemini model name', required: true, default: 'gemini-2.0-flash-lite' },
      { key: 'LINEAR_API_KEY', label: 'Linear API key (optional — press Enter to skip)', required: false },
    ];

    const updates: Array<{ key: string; value: string }> = [];

    for (const field of fields) {
      const existing = readExistingEnvKey(field.key) || process.env[field.key] || '';
      const displayDefault = existing
        ? `current: ${maskValue(existing)}`
        : field.default
        ? `default: ${field.default}`
        : '';
      const hint = displayDefault ? ` [${displayDefault}]` : '';
      const input = await ask(rl, `  ${field.label}${hint}: `);
      const value = input.trim() || existing || field.default || '';

      if (field.required && !value) {
        console.error(`\n${field.key} is required. Run config init again to complete setup.`);
        rl.close();
        process.exit(1);
      }

      if (value) updates.push({ key: field.key, value });
    }

    rl.close();

    for (const { key, value } of updates) {
      writeEnvKey(GLOBAL_ENV_FILE, key, value);
    }

    console.log(`\nConfig saved to ${GLOBAL_ENV_FILE}`);
    console.log('\nNext: run  daily-summary doctor  to verify your setup.');
  } catch (err) {
    rl.close();
    throw err;
  }
}
