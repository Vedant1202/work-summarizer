import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummaryLength } from '../config/types';
import { NormalizedCommit } from '../git/normalizer';
import { buildSummarizationPrompt } from './prompts';
import { LLMProvider } from './types';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is required. Set it via environment variable or `daily-summary config set llm.apiKey <key>`.');
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async summarize(commits: NormalizedCommit[], summaryLength: SummaryLength): Promise<string> {
    if (commits.length === 0) {
      return 'No commits found in the specified time window.';
    }

    const prompt = buildSummarizationPrompt(commits, summaryLength);
    const genModel = this.client.getGenerativeModel({ model: this.model });

    let result;
    try {
      result = await genModel.generateContent(prompt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API error: ${message}`);
    }

    const text = result.response.text();
    if (!text?.trim()) {
      throw new Error('Gemini returned an empty response. Try a different model or check your API key.');
    }

    return text.trim();
  }

  async rawPrompt(prompt: string): Promise<string> {
    const genModel = this.client.getGenerativeModel({ model: this.model });
    let result;
    try {
      result = await genModel.generateContent(prompt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API error: ${message}`);
    }
    return result.response.text().trim();
  }
}
