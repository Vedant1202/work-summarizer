import {
  MintlifyDeployMode,
  MintlifyDeployRecord,
  MintlifyFilesChanged,
  MintlifyPreviewTriggerResponse,
  MintlifyStatusResponse,
  MintlifyTriggerResponse,
} from './types';

const BASE_URL = 'https://api.mintlify.com/v1';
export const DEFAULT_POLL_INTERVAL_MS = 4_000;
export const DEFAULT_TIMEOUT_MS = 300_000;

async function mintlifyFetch<T>(
  url: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Mintlify API error: ${message}`);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      detail = body.error ?? body.message ?? detail;
    } catch {
      // ignore parse failure
    }
    throw new Error(`Mintlify API error ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

export class MintlifyDeployClient {
  private readonly apiKey: string;
  private readonly projectId: string;

  constructor(apiKey: string, projectId: string) {
    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  async triggerProduction(): Promise<MintlifyTriggerResponse> {
    return mintlifyFetch<MintlifyTriggerResponse>(
      `${BASE_URL}/project/update/${this.projectId}`,
      this.apiKey,
      { method: 'POST' },
    );
  }

  async triggerPreview(branch: string): Promise<MintlifyPreviewTriggerResponse> {
    return mintlifyFetch<MintlifyPreviewTriggerResponse>(
      `${BASE_URL}/project/preview/${this.projectId}`,
      this.apiKey,
      { method: 'POST', body: JSON.stringify({ branch }) },
    );
  }

  async getStatus(statusId: string): Promise<MintlifyStatusResponse> {
    return mintlifyFetch<MintlifyStatusResponse>(
      `${BASE_URL}/project/update-status/${statusId}`,
      this.apiKey,
    );
  }

  async triggerAndWait(
    mode: MintlifyDeployMode,
    options: {
      branch?: string;
      pollIntervalMs?: number;
      timeoutMs?: number;
      onTick?: (status: MintlifyStatusResponse) => void;
    } = {},
  ): Promise<{ statusId: string; previewUrl?: string; finalStatus: MintlifyStatusResponse; filesChanged?: MintlifyFilesChanged }> {
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let statusId: string;
    let previewUrl: string | undefined;

    if (mode === 'preview') {
      if (!options.branch) throw new Error('branch is required for preview deployments');
      const result = await this.triggerPreview(options.branch);
      statusId = result.statusId;
      previewUrl = result.previewUrl;
    } else {
      const result = await this.triggerProduction();
      statusId = result.statusId;
    }

    const start = Date.now();
    let finalStatus: MintlifyStatusResponse | undefined;

    while (true) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Mintlify deploy timed out after ${timeoutMs / 1000}s`);
      }

      const status = await this.getStatus(statusId);
      options.onTick?.(status);

      if (status.status === 'success' || status.status === 'failure') {
        finalStatus = status;
        break;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return {
      statusId,
      previewUrl,
      finalStatus,
      filesChanged: finalStatus.commit?.filesChanged,
    };
  }

  buildDeployRecord(
    statusId: string,
    mode: MintlifyDeployMode,
    finalStatus: MintlifyStatusResponse,
    opts: { branch?: string; previewUrl?: string },
  ): MintlifyDeployRecord {
    return {
      statusId,
      projectId: this.projectId,
      triggeredAt: new Date().toISOString(),
      mode,
      branch: opts.branch,
      previewUrl: opts.previewUrl,
      finalStatus: finalStatus.status,
      endedAt: finalStatus.endedAt,
      subdomain: finalStatus.subdomain,
      summary: finalStatus.summary,
      filesChanged: finalStatus.commit?.filesChanged,
      commitSha: finalStatus.commit?.sha,
      commitMessage: finalStatus.commit?.message,
    };
  }
}
