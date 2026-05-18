export type SummaryLength = 'short' | 'medium' | 'long';

export interface LLMConfig {
  model?: string;
  summaryLength: SummaryLength;
  apiKey?: string;
}

export interface OutputConfig {
  dir: string;
}

export interface Config {
  repoPath: string;
  branch: string;
  timeWindow: string;
  llm: LLMConfig;
  output: OutputConfig;
}

export type ConfigScope = 'local' | 'global';
