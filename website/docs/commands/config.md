---
title: config
sidebar_label: config
sidebar_position: 4
---

# `config`

View and modify the configuration for `work-summary`.

```bash
work-summary config <subcommand> [options]
```

## `config init`

Interactive setup wizard. Prompts for API keys and model settings, then saves them to `~/.work-summary/.env`.

```bash
work-summary config init
```

Requires an interactive terminal (`stdin` must be a TTY). If you're in a non-interactive context, set values directly:

```bash
export GEMINI_API_KEY="AIza..."
# or
work-summary config set llm.apiKey "AIza..."
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
work-summary config show
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
    "dir": "/Users/you/.work-summary/reports"
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
work-summary config get <key>
```

### Examples

```bash
work-summary config get output.dir
# → /Users/you/.work-summary/reports

work-summary config get llm.summaryLength
# → medium

work-summary config get integrations.linear.teamId
# → abc123
```

---

## `config set <key> <value>`

Write a config value. Defaults to repo-local (`.work-summary.json`). Use `--global` for `~/.work-summary/config.json`.

```bash
work-summary config set <key> <value> [--global]
```

### Options

| Flag | Description |
|---|---|
| `--global` | Write to `~/.work-summary/config.json` instead of the repo-local `.work-summary.json`. |

### Examples

```bash
# Repo-local settings
work-summary config set branch main
work-summary config set timeWindow 48h
work-summary config set output.format both
work-summary config set llm.summaryLength long

# Integrations
work-summary config set integrations.linear.teamId "team-abc123"
work-summary config set integrations.docsRepo.path "/path/to/docs-repo"
work-summary config set integrations.mintlify.projectId "my-project"

# Global settings (shared across repos)
work-summary config set output.dir "~/.work-summary/reports" --global
work-summary config set llm.summaryLength medium --global
```

:::tip Secrets vs config
API keys should live in `~/.work-summary/.env` (managed by `config init`) or shell environment variables — **not** in JSON config files. Use `config set` for non-secret settings like `branch`, `timeWindow`, `output.dir`.
:::

## Config file locations

| File | Scope | Written by |
|---|---|---|
| `~/.work-summary/.env` | Global secrets | `config init` |
| `~/.work-summary/config.json` | Global non-secrets | `config set --global` |
| `.work-summary.json` | Repo-local | `config set` |
