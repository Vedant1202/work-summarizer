---
title: Overview
sidebar_label: Overview
sidebar_position: 1
---

# Configuration Overview

`daily-summary` builds its runtime config by merging four layers, from lowest to highest priority:

```
Built-in defaults
    ↓
~/.daily-summary/config.json  (global JSON)
    ↓
.daily-summary.json           (repo-local JSON)
    ↓
Environment variables         (shell + .env files)
```

A value set at a higher layer always wins. Shell-exported variables take precedence over anything in `.env` files; `.env` files only fill keys that aren't already set.

## Built-in Defaults

| Field | Default | Description |
|---|---|---|
| `repoPath` | `.` | Repository to scan (current directory) |
| `branch` | `main` | Branch passed to `git log` |
| `timeWindow` | `24h` | Commit window |
| `llm.summaryLength` | `medium` | Gemini summary verbosity |
| `output.dir` | `~/.daily-summary/reports` | Report output directory |

## Per-Layer Details

### Built-in defaults

Hard-coded in `src/config/loader.ts`. Always present — you never need to specify these unless you want something different.

### Global JSON — `~/.daily-summary/config.json`

Written by `daily-summary config set --global`. Good for non-secret preferences shared across all repos on your machine (e.g., `output.dir`, `llm.summaryLength`).

```bash
daily-summary config set output.dir "~/Reports" --global
daily-summary config set llm.summaryLength long --global
```

### Repo-local JSON — `.daily-summary.json`

Written by `daily-summary config set` (without `--global`). Commit this file to share defaults with your team or to pin settings per project.

```bash
daily-summary config set branch main
daily-summary config set timeWindow 48h
daily-summary config set integrations.linear.teamId team-abc123
```

### Environment variables

The highest-priority layer. Loaded from:
1. `~/.daily-summary/.env` (global, written by `config init`)
2. `.env` in the current working directory (repo-local, for source checkouts)
3. Your shell environment (`export VAR=value`)

Each source only sets keys that aren't already present. Shell-exported variables always win.

See [Environment Variables](./env-variables.md) for the full list.

## All Config Keys

| Key | Type | Description |
|---|---|---|
| `repoPath` | string | Default repo path when `--repo` is omitted. |
| `branch` | string | Default branch to scan. |
| `timeWindow` | string | Default commit window (`30m`, `24h`, `2d`, `1w`). |
| `excludePaths` | string[] | Patterns or substrings excluded from normalized diffs. |
| `focusAreas` | string[] | Only include commits that touch at least one of these patterns. |
| `llm.provider` | string | LLM provider. `"gemini"` (default), an npm package (e.g. `"@daily-summary/openai"`), or a relative path. |
| `llm.model` | string | Model name passed to the active provider. |
| `llm.baseUrl` | string | Custom API base URL for OpenAI-compatible providers (Ollama, Groq, etc.). |
| `llm.summaryLength` | `short\|medium\|long` | Summary verbosity. |
| `llm.promptTemplate` | string | Path to a `.mustache` template file that overrides the built-in summarization prompt. |
| `output.dir` | string | Report output directory (`~` is expanded). |
| `output.format` | `markdown\|html\|both` | Default export format. |
| `integrations.linear.teamId` | string | Linear team ID for `docs --create-issues`. |
| `integrations.docsRepo.path` | string | Local docs repository path for `docs push`. |
| `integrations.docsRepo.outputDir` | string | Subdirectory inside docs repo. Defaults to `doc-tasks`. |
| `integrations.docsRepo.autoCommit` | boolean | Auto git-commit in the docs repo after `docs push`. |
| `integrations.mintlify.projectId` | string | Mintlify project ID. |

:::warning Secrets in config files
Never put API keys in committed JSON config files. Use `~/.daily-summary/.env`, your shell's `export`, or `config init`. The `config show` command always masks key values.
:::
