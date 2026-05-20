# @daily-summary/openai

OpenAI-compatible provider plugin for [daily-commit-summarizer](https://github.com/Vedant1202/daily-work-summarizer).

One adapter covers: **OpenAI**, **Ollama**, **Groq**, **Mistral**, **Together.ai**, **LM Studio**, and any other OpenAI Chat Completions-compatible endpoint.

## Install

```bash
npm install -g @daily-summary/openai openai
```

## Configuration

Add `llm.provider` to your `.daily-summary.json` (repo-local) or `~/.daily-summary/config.json` (global):

### OpenAI

```json
{
  "llm": {
    "provider": "@daily-summary/openai",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  }
}
```

### Ollama (local)

```json
{
  "llm": {
    "provider": "@daily-summary/openai",
    "apiKey": "ollama",
    "model": "llama3.2",
    "baseUrl": "http://localhost:11434/v1"
  }
}
```

### Groq

```json
{
  "llm": {
    "provider": "@daily-summary/openai",
    "apiKey": "gsk_...",
    "model": "llama-3.1-70b-versatile",
    "baseUrl": "https://api.groq.com/openai/v1"
  }
}
```

### Mistral

```json
{
  "llm": {
    "provider": "@daily-summary/openai",
    "apiKey": "...",
    "model": "mistral-large-latest",
    "baseUrl": "https://api.mistral.ai/v1"
  }
}
```

### LM Studio

```json
{
  "llm": {
    "provider": "@daily-summary/openai",
    "apiKey": "lm-studio",
    "model": "local-model",
    "baseUrl": "http://localhost:1234/v1"
  }
}
```

## Writing your own provider

Any npm package or local file can be a provider. It must export a default factory function:

```typescript
import type { LLMProvider, LLMProviderConfig } from 'daily-commit-summarizer';

export default function createProvider(config: LLMProviderConfig): LLMProvider {
  return {
    async rawPrompt(prompt: string): Promise<string> {
      // call your LLM API here
      return yourApiClient.complete(prompt);
    },
  };
}
```

Then set `"llm": { "provider": "@your-scope/your-provider" }` in your config.
