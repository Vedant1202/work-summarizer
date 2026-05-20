import OpenAI from 'openai';

export interface LLMProvider {
  rawPrompt(prompt: string): Promise<string>;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * Factory function for the OpenAI-compatible daily-summary provider.
 *
 * Works with any OpenAI-compatible endpoint:
 *   - OpenAI (default)
 *   - Ollama: baseUrl = "http://localhost:11434/v1", apiKey = "ollama"
 *   - Groq:   baseUrl = "https://api.groq.com/openai/v1"
 *   - Mistral: baseUrl = "https://api.mistral.ai/v1"
 *   - LM Studio: baseUrl = "http://localhost:1234/v1", apiKey = "lm-studio"
 *
 * Usage in .daily-summary.json:
 * {
 *   "llm": {
 *     "provider": "@daily-summary/openai",
 *     "apiKey": "sk-...",
 *     "model": "gpt-4o",
 *     "baseUrl": "https://api.openai.com/v1"
 *   }
 * }
 */
export default function createProvider(config: ProviderConfig): LLMProvider {
  const apiKey = config.apiKey ?? 'no-key';
  const model = config.model ?? 'gpt-4o-mini';
  const baseURL = config.baseUrl;

  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

  return {
    async rawPrompt(prompt: string): Promise<string> {
      let response;
      try {
        response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`OpenAI-compatible API error: ${message}`);
      }

      const text = response.choices[0]?.message?.content;
      if (!text?.trim()) {
        throw new Error('Provider returned an empty response. Check your model name and API key.');
      }

      return text.trim();
    },
  };
}
