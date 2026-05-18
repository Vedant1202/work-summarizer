---
id: introduction
title: Introduction
sidebar_label: Introduction
sidebar_position: 1
slug: /introduction
---

# Introduction

`daily-commit-summarizer` is a TypeScript CLI that turns local Git history into polished daily stand-up summaries. It scans commits for a configurable time window, filters noise, asks Gemini to summarise the work, and exports Markdown or HTML reports — all from a single command.

## What It Does

- **Stand-up summaries** — Scans a git repo for a window like `24h`, `2d`, or `1w` and generates a grouped, readable summary categorised by feature, fix, refactor, test, docs, chore, and performance.
- **Linear enrichment** — Extracts issue identifiers from commit messages and branch names, fetches metadata from Linear, and groups commits under issue headings with status and priority.
- **Doc-task detection** — Analyses diffs for documentation-impacting signals (new exports, CLI flags, breaking changes, schema changes) and produces a reviewable task list with LLM-enriched action items.
- **Mintlify deployments** — Triggers, polls, and tracks Mintlify documentation deployments, with a deployment history cache and an AI-powered changelog summary.
- **Flexible export** — Saves reports as Markdown, styled HTML, or both. Access them later with `history` and `export` commands.
- **Scheduling** — Ships with macOS LaunchAgent and Linux crontab support for automated daily runs.

## Architecture

### Report Generation Flow

```mermaid
flowchart TD
  A["CLI: daily-summary run"] --> B["Load configuration"]
  B --> C["Read git commits"]
  C --> D["Normalize diffs and categorize commits"]
  D --> E["Generate summary with Gemini"]
  E --> F{"--with-linear?"}
  F -->|Yes| G["Fetch Linear issue metadata"]
  F -->|No| H["Skip Linear enrichment"]
  G --> I["Detect doc-impact signals"]
  H --> I
  I --> J["Render report Markdown"]
  J --> K{"Editor review?"}
  K -->|Yes| L["Open report in $EDITOR"]
  K -->|No| M["Use generated report"]
  L --> N["Export report"]
  M --> N
  N --> O["Write .md / .html files"]
```

### Documentation Task Flow

```mermaid
flowchart TD
  A["CLI: daily-summary docs"] --> B["Load configuration"]
  B --> C["Read git commits"]
  C --> D["Normalize diffs"]
  D --> E["Detect documentation signals"]
  E --> F{"Signals found?"}
  F -->|No| G["Exit — no tasks"]
  F -->|Yes| H["Generate doc task candidates"]
  H --> I{"LLM enabled?"}
  I -->|Yes| J["Enrich descriptions with Gemini"]
  I -->|No| K["Use template descriptions"]
  J --> L["Interactive review (A/R/E/S)"]
  K --> L
  L --> M{"--create-issues?"}
  M -->|Yes| N["Create Linear issues"]
  M -->|No| O["Skip issue creation"]
  N --> P["Export accepted tasks"]
  O --> P
  P --> Q["Write .md / .json files"]
```

### Config Resolution Order

```mermaid
flowchart TD
  A["Built-in defaults"] --> F["Merged config"]
  B["~/.daily-summary/config.json"] --> F
  C[".daily-summary.json (repo-local)"] --> F
  D["~/.daily-summary/.env + ./.env"] --> E["process.env vars"]
  E --> F
  F --> G["Runtime config"]
```

Resolution priority (lowest → highest): built-in defaults → global JSON → local JSON → `.env` files → shell-exported environment variables. Shell-exported values override anything written in `.env` files.

### Web UI Flow

```mermaid
flowchart TD
  A["CLI: daily-summary ui"] --> B["Express server :7331"]
  B --> C["Serves React SPA"]
  C --> D["Browser opens http://localhost:7331"]
  D --> E{"Page"}
  E -->|Dashboard| F["POST /api/run → runCommand"]
  E -->|Reports| G["GET /api/reports → report cache"]
  E -->|Config| H["GET/POST /api/config → config files"]
  E -->|Mintlify| I["GET/POST /api/mintlify/* → Mintlify API + local cache"]
  E -->|Doctor| J["GET /api/doctor → connectivity checks"]
```

## Generated Files

| Output | Default location |
|---|---|
| Stand-up reports | `~/.daily-summary/reports/<date>-<repo>.md` and optionally `.html` |
| Documentation tasks | `~/.daily-summary/doc-tasks/<date>-<repo>.md` and optionally `.json` |
| Global secrets | `~/.daily-summary/.env` |
| Global config | `~/.daily-summary/config.json` |
| Mintlify deploy cache | `~/.daily-summary/mintlify-deployments.json` |
| Schedule logs | `~/.daily-summary/logs/` |

## Source Layout

```
src/
├── bin/daily-summary.ts       CLI entry point
├── cli/
│   ├── index.ts               Commander command registration
│   ├── review.ts              Editor-based review helper
│   └── commands/              run, ui, docs, mintlify, config, doctor, export, history, schedule
├── config/
│   ├── loader.ts              Defaults, env files, JSON config, masking
│   └── types.ts               Runtime configuration types
├── docs/
│   ├── detector.ts            Documentation-impact signal rules
│   ├── generator.ts           Doc task generation + optional LLM enrichment
│   └── exporter.ts            Markdown/JSON export and docs-repo push
├── git/
│   ├── ingestion.ts           git log/show collection
│   └── normalizer.ts          Diff cleanup, categorisation, budget limiting
├── integrations/
│   ├── extractor.ts           Issue reference extraction
│   ├── linear/client.ts       Linear API wrapper
│   └── mintlify/              Deploy client, types, deployment cache
├── llm/
│   ├── gemini.ts              Gemini provider
│   └── prompts.ts             Prompt construction
├── report/
│   ├── generator.ts           Report model + Markdown rendering
│   ├── exporter.ts            Report file writing and lookup
│   └── html.ts                HTML report rendering
└── ui/
    ├── server.ts              Express app factory
    └── routes/                API routes: run, reports, config, mintlify, doctor
ui/                            React + Vite frontend (served by the Express server)
```

## Next Steps

- [Installation →](./installation.md)
- [Run your first summary →](./commands/run.md)
