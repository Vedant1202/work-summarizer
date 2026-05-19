---
title: config
sidebar_label: config
sidebar_position: 4
---

# `config`

View and modify the configuration for `daily-summary`.

```bash
daily-summary config <subcommand> [options]
```

## `config init`

Interactive setup wizard. Prompts for API keys and model settings, then saves them to `~/.daily-summary/.env`.

```bash
daily-summary config init
```

Requires an interactive terminal (`stdin` must be a TTY). If you're in a non-interactive context, set values directly:

```bash
export GEMINI_API_KEY="AIza..."
# or
daily-summary config set llm.apiKey "AIza..."
```

### Wizard fields

| Field | Required | Default |
|---|---|---|
| Gemini API key | Yes | — |
| Gemini model name | Yes | `gemini-3.1-flash-lite` |
| Linear API key | No | — |
| Mintlify API key | No | — |
| Mintlify project ID | No | — |

Previously saved values are shown masked (e.g. `AIza***key`) — press Enter to keep them.

---

## `config show`

Print the full merged configuration with API keys masked.

```bash
daily-summary config show
```

```json
{
  "repoPath": ".",
  "branch": "main",
  "timeWindow": "24h",
  "llm": {
    "summaryLength": "medium",
    "apiKey": "***",
    "model": "gemini-3.1-flash-lite"
  },
  "output": {
    "dir": "/Users/you/.daily-summary/reports"
  },
  "integrations": {
    "linear": {
      "apiKey": "***",
      "teamId": "abc123"
    },
    "mintlify": {
      "apiKey": "***",
      "projectId": "my-project"
    }
  }
}
```

---

## `config get <key>`

Read a single config value using a dot-path.

```bash
daily-summary config get <key>
```

### Examples

```bash
daily-summary config get output.dir
# → /Users/you/.daily-summary/reports

daily-summary config get llm.summaryLength
# → medium

daily-summary config get integrations.linear.teamId
# → abc123
```

---

## `config set <key> <value>`

Write a config value. Defaults to repo-local (`.daily-summary.json`). Use `--global` for `~/.daily-summary/config.json`.

```bash
daily-summary config set <key> <value> [--global]
```

### Options

| Flag | Description |
|---|---|
| `--global` | Write to `~/.daily-summary/config.json` instead of the repo-local `.daily-summary.json`. |

### Examples

```bash
# Repo-local settings
daily-summary config set branch main
daily-summary config set timeWindow 48h
daily-summary config set output.format both
daily-summary config set llm.summaryLength long

# Integrations
daily-summary config set integrations.linear.teamId "team-abc123"
daily-summary config set integrations.docsRepo.path "/path/to/docs-repo"
daily-summary config set integrations.mintlify.projectId "my-project"

# Global settings (shared across repos)
daily-summary config set output.dir "~/.daily-summary/reports" --global
daily-summary config set llm.summaryLength medium --global
```

:::tip Secrets vs config
API keys should live in `~/.daily-summary/.env` (managed by `config init`) or shell environment variables — **not** in JSON config files. Use `config set` for non-secret settings like `branch`, `timeWindow`, `output.dir`.
:::

## Config file locations

| File | Scope | Written by |
|---|---|---|
| `~/.daily-summary/.env` | Global secrets | `config init` |
| `~/.daily-summary/config.json` | Global non-secrets | `config set --global` |
| `.daily-summary.json` | Repo-local | `config set` |
