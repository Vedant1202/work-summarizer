---
title: Custom LLM Providers
sidebar_label: Custom Providers
sidebar_position: 3
---

# Custom LLM Providers

`work-summary` ships with Gemini as the default provider, but any LLM can be plugged in via the provider plugin system.

## How It Works

Set `llm.provider` in your config to an npm package name or a local file path. The package must export a factory function that returns an object with a `rawPrompt(prompt)` method.

```json
{
  "llm": {
    "provider": "@work-summary/openai",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  }
}
```

When `llm.provider` is omitted or set to `"gemini"`, the built-in Gemini adapter is used (backward compatible — no changes needed for existing setups).

---

## `@work-summary/openai`

The official OpenAI-compatible adapter covers **OpenAI, Ollama, Groq, Mistral, Together.ai, LM Studio**, and any other endpoint that speaks the OpenAI Chat Completions format.

### Install

```bash
npm install -g @work-summary/openai openai
```

### Usage

#### OpenAI

```json
{
  "llm": {
    "provider": "@work-summary/openai",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  }
}
```

#### Ollama (local, no API key needed)

```json
{
  "llm": {
    "provider": "@work-summary/openai",
    "apiKey": "ollama",
    "model": "llama3.2",
    "baseUrl": "http://localhost:11434/v1"
  }
}
```

#### Groq

```json
{
  "llm": {
    "provider": "@work-summary/openai",
    "apiKey": "gsk_...",
    "model": "llama-3.1-70b-versatile",
    "baseUrl": "https://api.groq.com/openai/v1"
  }
}
```

#### Mistral

```json
{
  "llm": {
    "provider": "@work-summary/openai",
    "apiKey": "...",
    "model": "mistral-large-latest",
    "baseUrl": "https://api.mistral.ai/v1"
  }
}
```

---

## Writing Your Own Provider

A provider is a Node.js module (CommonJS) that exports a factory function.

### Interface

```typescript
export interface LLMProvider {
  rawPrompt(prompt: string): Promise<string>;
}

export interface LLMProviderConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  promptTemplate?: string;
  [key: string]: unknown; // any extra fields from llm config
}

// Your module must export this:
export default function createProvider(config: LLMProviderConfig): LLMProvider;
```

### Minimal example

```typescript
// my-provider.js
module.exports = function createProvider(config) {
  return {
    async rawPrompt(prompt) {
      const res = await fetch('https://my-llm-api.example.com/v1/complete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model: config.model }),
      });
      const data = await res.json();
      return data.text;
    },
  };
};
```

Set in your config:

```json
{
  "llm": {
    "provider": "./my-provider.js",
    "apiKey": "...",
    "model": "my-model"
  }
}
```

### Publishing as an npm package

If you publish `@your-scope/my-provider` to npm, users can install it globally and reference it by name:

```json
{ "llm": { "provider": "@your-scope/my-provider" } }
```

:::warning Security note
Provider modules are loaded with Node.js `require()`. Only use provider packages from sources you trust — treat them with the same caution as any npm dependency.
:::

---

## Config Reference

| Key | Type | Description |
|---|---|---|
| `llm.provider` | string | `"gemini"` (default), an npm package name, or a relative path (`"./my-provider.js"`). |
| `llm.apiKey` | string | Passed to the provider factory as `config.apiKey`. |
| `llm.model` | string | Passed to the provider factory as `config.model`. |
| `llm.baseUrl` | string | Passed to the provider factory as `config.baseUrl`. Used by OpenAI-compat providers to target custom endpoints. |
