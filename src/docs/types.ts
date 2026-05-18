export type DocTaskSeverity = 'high' | 'medium' | 'low';

export type DocTaskCategory =
  | 'breaking-change'
  | 'new-api'
  | 'cli-option'
  | 'config-change'
  | 'schema-change'
  | 'new-feature'
  | 'general';

export type DocTaskStatus = 'pending' | 'accepted' | 'rejected';

export type DocExportFormat = 'markdown' | 'json' | 'both';

export interface DocSignal {
  commitSha: string;
  commitMessage: string;
  triggerFile: string;
  triggerPattern: string;
  category: DocTaskCategory;
  severity: DocTaskSeverity;
  diffHunk?: string;
}

export interface DocTask {
  id: string;
  title: string;
  severity: DocTaskSeverity;
  category: DocTaskCategory;
  commitSha: string;
  commitMessage: string;
  triggerFile: string;
  description: string;
  actionItems: string[];
  suggestedDocFiles: string[];
  status: DocTaskStatus;
  linearIssueUrl?: string;
  linearIssueIdentifier?: string;
}
