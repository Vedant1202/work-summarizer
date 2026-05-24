import path from 'path';
import { LLMProvider, LLMProviderConfig } from './types';
import { LLMConfig } from '../config/types';
import { GeminiProvider } from './gemini';

export function createProvider(config: LLMConfig): LLMProvider {
  const { provider, apiKey, model } = config;

  if (!provider || provider === 'gemini') {
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Export it as an environment variable or run:\n' +
        '  work-summary config init',
      );
    }
    if (!model) {
      throw new Error(
        'GEMINI_MODEL is not set. Export it as an environment variable or run:\n' +
        '  work-summary config init',
      );
    }
    return new GeminiProvider(apiKey, model);
  }

  // Resolve module: local path ("./my-provider") or npm package name
  const modulePath = provider.startsWith('.')
    ? path.resolve(process.cwd(), provider)
    : provider;

  let mod: unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(modulePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!provider.startsWith('.')) {
      throw new Error(
        `LLM provider "${provider}" not found. Did you run: npm install ${provider}?\n${message}`,
      );
    }
    throw new Error(`LLM provider module not found at "${provider}": ${message}`);
  }

  // Support both `module.exports = factory` and `module.exports.default = factory`
  const factory = (mod as { default?: unknown }).default ?? mod;

  if (typeof factory !== 'function') {
    throw new Error(
      `LLM provider "${provider}" must export a factory function. ` +
      `Expected: (config) => LLMProvider. Got: ${typeof factory}`,
    );
  }

  const instance = (factory as (config: LLMProviderConfig) => LLMProvider)(config as LLMProviderConfig);

  if (!instance || typeof (instance as LLMProvider).rawPrompt !== 'function') {
    throw new Error(
      `LLM provider "${provider}" factory must return an object with a rawPrompt(prompt: string): Promise<string> method.`,
    );
  }

  return instance;
}
