# daily-commit-summarizer

[![npm version](https://img.shields.io/npm/v/daily-commit-summarizer.svg)](https://www.npmjs.com/package/daily-commit-summarizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-6366f1)](https://Vedant1202.github.io/daily-work-summarizer/)

`daily-commit-summarizer` is a TypeScript CLI that turns local Git history into polished daily stand-up summaries. Point it at any repo, choose a time window, and get a structured, AI-generated report — categorised by feature, fix, refactor, test, chore, and more.

**[Full documentation →](https://Vedant1202.github.io/daily-work-summarizer/)**

## What It Does

- Scans commits for a configurable window (`24h`, `2d`, `1w`, …) and generates a stand-up-ready summary with Gemini
- Filters noise — lock files, binaries, build output, and configurable excludes
- Enriches reports with Linear issue metadata when commit messages reference tickets
- Detects commits that need documentation follow-up and produces a reviewable task list
- Triggers, polls, and summarises Mintlify documentation deployments
- Exports Markdown and styled HTML reports; supports scheduled daily runs
- Launches a local web UI for reports, run controls, config, and Mintlify management

## Quick Start

```bash
npm install -g daily-commit-summarizer
daily-summary config init          # set your Gemini API key
daily-summary doctor               # verify setup
daily-summary run --since 24h --no-edit
daily-summary ui                   # open the web UI at http://localhost:7331
```

## Architecture

### Report Generation Flow

```mermaid
flowchart TD
  A["CLI command: daily-summary run"] --> B["Load configuration"]
  B --> C["Read git commits"]
  C --> D["Normalize diffs and categorize commits"]
  D --> E["Build Gemini prompt"]
  E --> F["Generate summary with Gemini"]
  D --> G{"--with-linear?"}
  G -->|Yes| H["Fetch Linear issue metadata"]
  G -->|No| I["Skip issue enrichment"]
  F --> J["Render report Markdown"]
  H --> J
  I --> J
  J --> K{"Editor review enabled?"}
  K -->|Yes| L["Open report in editor"]
  K -->|No| M["Use generated report"]
  L --> N["Export report"]
  M --> N
  N --> O["Write Markdown / HTML files"]
```

### Configuration Resolution

```mermaid
flowchart TD
  A["Built-in defaults"] --> E["Merged config"]
  B["~/.daily-summary/config.json"] --> E
  C[".daily-summary.json"] --> E
  D["Environment variables"] --> E
  E --> F["Runtime config"]
```

## Requirements

- Node.js >= 18
- Git available in `PATH`
- [Gemini API key](https://aistudio.google.com/apikey) (free tier available)

## Documentation

The full reference — all commands, flags, configuration options, integration guides, and development notes — lives at:

**https://Vedant1202.github.io/daily-work-summarizer/**

## License

MIT
