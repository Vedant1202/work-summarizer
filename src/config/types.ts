export type SummaryLength = 'short' | 'medium' | 'long';
export type OutputFormat = 'markdown' | 'html' | 'both';
export type CommitCategory = 'feat' | 'fix' | 'refactor' | 'docs' | 'chore' | 'perf' | 'test' | 'other';

export interface LLMConfig {
  model?: string;
  summaryLength: SummaryLength;
  apiKey?: string;
}

export interface OutputConfig {
  dir: string;
  format?: OutputFormat;
}

export interface Config {
  repoPath: string;
  branch: string;
  timeWindow: string;
  excludePaths?: string[];
  focusAreas?: string[];
  llm: LLMConfig;
  output: OutputConfig;
  integrations?: IntegrationsConfig;
}

export interface LinearIntegrationConfig {
  apiKey?: string;
  teamId?: string;
  teamName?: string;
}

export interface DocsRepoConfig {
  path?: string;
  outputDir?: string;
  autoCommit?: boolean;
}

export interface IntegrationsConfig {
  linear?: LinearIntegrationConfig;
  docsRepo?: DocsRepoConfig;
}

export type ConfigScope = 'local' | 'global';
