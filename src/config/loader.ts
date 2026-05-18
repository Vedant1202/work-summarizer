import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config, ConfigScope } from './types';

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.daily-summary');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');
const LOCAL_CONFIG_FILE = '.daily-summary.json';

const DEFAULTS: Config = {
  repoPath: '.',
  branch: 'main',
  timeWindow: '24h',
  llm: {
    model: process.env.GEMINI_MODEL,
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

function deepMerge(base: Config, override: Partial<Config>): Config {
  return {
    ...base,
    ...override,
    llm: { ...base.llm, ...(override.llm ?? {}) },
    output: { ...base.output, ...(override.output ?? {}) },
  };
}

export function loadConfig(): Config {
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

export function maskConfig(config: Config): Config {
  const masked = JSON.parse(JSON.stringify(config)) as Config;
  if (masked.llm.apiKey) {
    masked.llm.apiKey = '***';
  }
  return masked;
}
