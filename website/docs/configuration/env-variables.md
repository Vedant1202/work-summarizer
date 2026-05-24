---
title: Environment Variables
sidebar_label: Environment Variables
sidebar_position: 2
---

# Environment Variables

## Variables

| Variable | Required | Used by | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | `run`, `doctor`, `docs` (with LLM) | Gemini API key. [Get one free at Google AI Studio.](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | **Yes** | `run`, `doctor`, `docs` (with LLM) | Gemini model name. The setup wizard defaults to `gemini-3.1-flash-lite`. Other options: `gemini-1.5-pro`, `gemini-2.0-flash`. |
| `LINEAR_API_KEY` | No | `run --with-linear`, `docs --create-issues`, `doctor` | Linear personal API key for fetching issue metadata or creating doc-task issues. |
| `MINTLIFY_API_KEY` | No | `mintlify trigger`, `mintlify status`, `doctor` | Mintlify API key. |
| `MINTLIFY_PROJECT_ID` | No | `mintlify trigger` | Mintlify project ID. |

## Env Files

| File | Scope | Notes |
|---|---|---|
| `~/.work-summary/.env` | Global | Created by `work-summary config init`. Loaded first; shell variables override it. |
| `.env` | Repo-local | For source checkouts. Listed in `.gitignore` — do not commit. |
| `.env.example` | Repo-local | Safe template to commit. Documents which variables are expected. |

### Load order

```
~/.work-summary/.env  →  ./.env  →  shell environment (highest)
```

Each source only fills keys that aren't already set. If `GEMINI_API_KEY` is already exported in your shell, the `.env` file value is ignored.

## Setting Variables

### Option 1 — `config init` (recommended for first-time setup)

```bash
work-summary config init
```

Writes to `~/.work-summary/.env`.

### Option 2 — Manual env file

```bash
# ~/.work-summary/.env
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.1-flash-lite
LINEAR_API_KEY=lin_api_...
MINTLIFY_API_KEY=mint_...
MINTLIFY_PROJECT_ID=my-project
```

### Option 3 — Shell export

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-3.1-flash-lite"
```

Add to your `~/.zshrc` or `~/.bashrc` for persistence.

### Option 4 — `config set` (non-secrets only for JSON config; for API keys use env files)

```bash
work-summary config set integrations.mintlify.projectId "my-project"
```

## Gemini Model Options

| Model | Notes |
|---|---|
| `gemini-3.1-flash-lite` | Default. Fast and cost-efficient. Good for most stand-up summaries. |
| `gemini-2.0-flash` | Faster than Pro, richer output than Flash Lite. |
| `gemini-1.5-pro` | Highest quality, slower, higher cost. Best for `--length long` or complex repos. |
| `gemini-1.5-flash` | Balanced speed/quality. |
