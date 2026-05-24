import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config, ConfigScope, IntegrationsConfig } from './types';

export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.work-summary');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');
const LOCAL_CONFIG_FILE = '.work-summary.json';
export const GLOBAL_ENV_FILE = path.join(GLOBAL_CONFIG_DIR, '.env');

const DEFAULTS: Config = {
  repoPath: '.',
  branch: 'main',
  timeWindow: '24h',
  llm: {
    summaryLength: 'medium',
  },
  output: {
    dir: path.join(GLOBAL_CONFIG_DIR, 'reports'),
  },
};

function readJsonFile(filePath: string): Partial<Config> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function mergeIntegrations(
  base?: IntegrationsConfig,
  override?: IntegrationsConfig,
): IntegrationsConfig | undefined {
  if (!base && !override) return undefined;
  return {
    ...base,
    ...override,
    linear: { ...(base?.linear ?? {}), ...(override?.linear ?? {}) },
    docsRepo: { ...(base?.docsRepo ?? {}), ...(override?.docsRepo ?? {}) },
    mintlify: { ...(base?.mintlify ?? {}), ...(override?.mintlify ?? {}) },
  };
}

function deepMerge(base: Config, override: Partial<Config>): Config {
  return {
    ...base,
    ...override,
    llm: { ...base.llm, ...(override.llm ?? {}) },
    output: { ...base.output, ...(override.output ?? {}) },
    integrations: mergeIntegrations(base.integrations, override.integrations),
  };
}

function loadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.substring(1, value.length - 1);
        }
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // Ignore reading errors
  }
}

export function loadConfig(): Config {
  // Global ~/.work-summary/.env loaded first (lowest priority)
  loadEnvFile(path.join(GLOBAL_CONFIG_DIR, '.env'));
  // Project-local .env overrides global (higher priority, won't overwrite already-set vars)
  loadEnvFile(path.join(process.cwd(), '.env'));

  const global = readJsonFile(GLOBAL_CONFIG_FILE);
  const local = readJsonFile(LOCAL_CONFIG_FILE);

  let config = deepMerge(DEFAULTS, global);
  config = deepMerge(config, local);

  // Env var overrides for secrets/config
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    config.llm.apiKey = envKey;
  }

  const envModel = process.env.GEMINI_MODEL;
  if (envModel) {
    config.llm.model = envModel;
  }

  const linearKey = process.env.LINEAR_API_KEY;
  if (linearKey) {
    if (!config.integrations) config.integrations = {};
    if (!config.integrations.linear) config.integrations.linear = {};
    config.integrations.linear.apiKey = linearKey;
  }

  const mintlifyKey = process.env.MINTLIFY_API_KEY;
  if (mintlifyKey) {
    if (!config.integrations) config.integrations = {};
    if (!config.integrations.mintlify) config.integrations.mintlify = {};
    config.integrations.mintlify.apiKey = mintlifyKey;
  }

  const mintlifyProjectId = process.env.MINTLIFY_PROJECT_ID;
  if (mintlifyProjectId) {
    if (!config.integrations) config.integrations = {};
    if (!config.integrations.mintlify) config.integrations.mintlify = {};
    config.integrations.mintlify.projectId = mintlifyProjectId;
  }

  return config;
}

function setNestedKey(obj: Record<string, unknown>, dotPath: string, value: unknown): void {
  const parts = dotPath.split('.');
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof cursor[part] !== 'object' || cursor[part] === null) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

export function saveConfig(scope: ConfigScope, key: string, value: string): void {
  const filePath = scope === 'local' ? LOCAL_CONFIG_FILE : GLOBAL_CONFIG_FILE;

  if (scope === 'global') {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }

  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    // file doesn't exist yet — start fresh
  }

  setNestedKey(existing, key, value);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
}

export function getNestedKey(obj: unknown, dotPath: string): unknown {
  return dotPath.split('.').reduce((cursor, part) => {
    if (cursor !== null && typeof cursor === 'object') {
      return (cursor as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

export function writeEnvKey(filePath: string, key: string, value: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  let lines: string[] = [];
  try {
    lines = fs.readFileSync(filePath, 'utf8').split('\n');
  } catch {
    // file doesn't exist yet — start empty
  }

  const keyPrefix = `${key}=`;
  const newLine = `${key}=${value}`;
  const idx = lines.findIndex((l) => l.startsWith(keyPrefix));
  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.splice(lines.length - 1, 0, newLine);
    } else {
      lines.push(newLine);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  if (!fs.readFileSync(filePath, 'utf8').endsWith('\n')) {
    fs.appendFileSync(filePath, '\n');
  }
}

export function maskConfig(config: Config): Config {
  const masked = JSON.parse(JSON.stringify(config)) as Config;
  if (masked.llm.apiKey) {
    masked.llm.apiKey = '***';
  }
  if (masked.integrations?.linear?.apiKey) {
    masked.integrations.linear.apiKey = '***';
  }
  if (masked.integrations?.mintlify?.apiKey) {
    masked.integrations.mintlify.apiKey = '***';
  }
  return masked;
}
