export type MintlifyDeployStatus = 'queued' | 'in_progress' | 'success' | 'failure';
export type MintlifyDeployMode = 'preview' | 'production';

export interface MintlifyTriggerResponse {
  statusId: string;
}

export interface MintlifyPreviewTriggerResponse {
  statusId: string;
  previewUrl: string;
}

export interface MintlifyFilesChanged {
  added: string[];
  modified: string[];
  removed: string[];
}

export interface MintlifyStatusResponse {
  _id: string;
  projectId: string;
  createdAt: string;
  endedAt?: string;
  status: MintlifyDeployStatus;
  summary?: string;
  logs: string[];
  subdomain: string;
  screenshot?: string;
  commit?: {
    sha: string;
    ref: string;
    message: string;
    filesChanged: MintlifyFilesChanged;
  };
  author?: {
    name: string;
    avatarUrl: string;
    githubUserId: string;
  };
  source?: string;
}

export interface MintlifyDeployRecord {
  statusId: string;
  projectId: string;
  triggeredAt: string;
  mode: MintlifyDeployMode;
  branch?: string;
  previewUrl?: string;
  finalStatus: MintlifyDeployStatus;
  endedAt?: string;
  subdomain?: string;
  summary?: string;
  filesChanged?: MintlifyFilesChanged;
  commitSha?: string;
  commitMessage?: string;
}
