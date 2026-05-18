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
