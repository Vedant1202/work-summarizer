import { SummaryLength } from '../config/types';

export interface LLMProvider {
  rawPrompt(prompt: string): Promise<string>;
}

export interface LLMProviderConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  promptTemplate?: string;
  summaryLength?: SummaryLength;
  [key: string]: unknown;
}
