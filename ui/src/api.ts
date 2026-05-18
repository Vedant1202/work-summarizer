const BASE = '/api';

export interface RunStatus {
  running: boolean;
  lastRunDate: string | null;
  error: string | null;
}

export interface RunOptions {
  since?: string;
  branch?: string;
  repo?: string;
  length?: string;
  format?: string;
  withLinear?: boolean;
}

export interface ReportMeta {
  date: string;
  repoName: string;
  filePath: string;
}

export interface ReportContent {
  date: string;
  filePath: string;
  content: string;
}

export interface AppConfig {
  repoPath: string;
  branch: string;
  timeWindow: string;
  llm: { model?: string; summaryLength: string; apiKey?: string };
  output: { dir: string; format?: string };
  integrations?: {
    linear?: { teamId?: string };
    mintlify?: { projectId?: string };
  };
}

export interface ScheduleStatus {
  scheduled: boolean;
  time: string | null;
  loaded: boolean;
  platform: 'macos' | 'linux';
}

export interface DoctorResult {
  ok: boolean;
  lines: string[];
}

export interface MintlifyDeployRecord {
  statusId: string;
  projectId: string;
  triggeredAt: string;
  mode: 'preview' | 'production';
  branch?: string;
  previewUrl?: string;
  finalStatus: string;
  endedAt?: string;
  subdomain?: string;
  summary?: string;
  filesChanged?: { added: string[]; modified: string[]; removed: string[] };
  commitSha?: string;
  commitMessage?: string;
}

export interface MintlifyStatusResult {
  status: string;
  subdomain?: string;
  summary?: string;
  createdAt?: string;
  endedAt?: string;
  commit?: {
    sha: string;
    message: string;
    filesChanged?: { added: string[]; modified: string[]; removed: string[] };
  };
}

export interface MintlifyTriggerResult {
  statusId: string;
  previewUrl?: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  triggerRun: (options: RunOptions = {}) =>
    fetch(`${BASE}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }).then((r) => json<{ started: boolean }>(r)),

  getRunStatus: () =>
    fetch(`${BASE}/run/status`).then((r) => json<RunStatus>(r)),

  listReports: () =>
    fetch(`${BASE}/reports`).then((r) => json<ReportMeta[]>(r)),

  getReport: (date: string) =>
    fetch(`${BASE}/reports/${date}`).then((r) => json<ReportContent>(r)),

  getReportByPath: (filePath: string) =>
    fetch(`${BASE}/reports/by-path?b64=${btoa(filePath)}`).then((r) => json<ReportContent>(r)),

  getConfig: () =>
    fetch(`${BASE}/config`).then((r) => json<AppConfig>(r)),

  setConfig: (key: string, value: string, scope: 'local' | 'global' = 'local') =>
    fetch(`${BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, scope }),
    }).then((r) => json<{ ok: boolean }>(r)),

  getSchedule: () =>
    fetch(`${BASE}/schedule`).then((r) => json<ScheduleStatus>(r)),

  setSchedule: (time: string) =>
    fetch(`${BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time }),
    }).then((r) => json<{ ok: boolean; status: ScheduleStatus }>(r)),

  removeSchedule: () =>
    fetch(`${BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove: true }),
    }).then((r) => json<{ ok: boolean; status: ScheduleStatus }>(r)),

  runDoctor: () =>
    fetch(`${BASE}/doctor`).then((r) => json<DoctorResult>(r)),

  // Mintlify
  mintlifyHistory: () =>
    fetch(`${BASE}/mintlify/history`).then((r) => json<MintlifyDeployRecord[]>(r)),

  mintlifyStatus: (statusId: string) =>
    fetch(`${BASE}/mintlify/status/${statusId}`).then((r) => json<MintlifyStatusResult>(r)),

  mintlifyTrigger: (mode: 'preview' | 'production', branch?: string) =>
    fetch(`${BASE}/mintlify/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, branch }),
    }).then((r) => json<MintlifyTriggerResult>(r)),

  mintlifySummary: (since: string) =>
    fetch(`${BASE}/mintlify/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ since }),
    }).then((r) => json<{ summary: string }>(r)),
};
