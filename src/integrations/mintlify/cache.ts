import fs from 'fs';
import os from 'os';
import path from 'path';
import { MintlifyDeployRecord } from './types';

const CACHE_PATH = path.join(os.homedir(), '.daily-summary', 'mintlify-deployments.json');

interface DeployCache {
  deployments: MintlifyDeployRecord[];
}

function readDeployCache(): DeployCache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as DeployCache;
  } catch {
    return { deployments: [] };
  }
}

export function appendDeployRecord(record: MintlifyDeployRecord): void {
  const cache = readDeployCache();
  cache.deployments.unshift(record);
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

export function listDeployRecords(limit?: number): MintlifyDeployRecord[] {
  const { deployments } = readDeployCache();
  return limit ? deployments.slice(0, limit) : deployments;
}

function sinceToDate(since: string): Date {
  const match = since.match(/^(\d+)(m|h|d|w)$/);
  if (!match) return new Date(since);
  const amount = parseInt(match[1], 10);
  const ms: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return new Date(Date.now() - amount * ms[match[2]]);
}

export function filterRecordsSince(records: MintlifyDeployRecord[], since: string): MintlifyDeployRecord[] {
  const cutoff = sinceToDate(since);
  return records.filter((r) => new Date(r.triggeredAt) >= cutoff);
}
