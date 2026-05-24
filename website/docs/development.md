---
id: development
title: Development
sidebar_label: Development
sidebar_position: 5
---

# Development & Contributing

## Prerequisites

- Node.js ≥ 18
- npm
- Git

## Local Setup

```bash
git clone https://github.com/Vedant1202/work-summarizer.git
cd work-summarizer
npm install
cp .env.example .env
```

Edit `.env`:

```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.1-flash-lite
```

## Running Without Building

```bash
# Any command via tsx (no compile step needed)
npm run dev -- doctor
npm run dev -- run --repo . --since 24h --no-edit
npm run dev -- docs --since 7d --no-review --no-llm
```

`tsx` compiles TypeScript on-the-fly. This is the fastest iteration loop.

## Build & Run Compiled Output

```bash
npm run build        # tsc → dist/, marks dist/bin/work-summary.js executable
npm start -- doctor  # runs node dist/bin/work-summary.js
```

## Testing

```bash
npm test            # vitest run (all *.test.ts files in src/)
npm run typecheck   # tsc --noEmit (no compilation, just type checking)
```

Tests are co-located with source files (`*.test.ts`). Run a specific test file:

```bash
npx vitest run src/git/normalizer.test.ts
```

Watch mode during development:

```bash
npx vitest
```

## Project Structure

```
src/
├── bin/
│   └── work-summary.ts     Entry point — imports cli/index
├── cli/
│   ├── index.ts             Commander program setup & command registration
│   ├── review.ts            Editor review helper (opens $EDITOR, handles no-changes prompt)
│   └── commands/
│       ├── run.ts           Main summarization pipeline
│       ├── docs.ts          Doc-task detection and review pipeline
│       ├── mintlify.ts      Mintlify subcommands (trigger/status/history/summary)
│       ├── config.ts        config init/show/get/set
│       ├── doctor.ts        Config validation and API ping
│       ├── export.ts        Re-export/open last report
│       ├── history.ts       List or open saved reports
│       └── schedule.ts      macOS LaunchAgent / Linux crontab setup
├── config/
│   ├── loader.ts            Config merge logic, env file loading, masking, writeEnvKey
│   └── types.ts             Config, LLMConfig, OutputConfig, IntegrationsConfig types
├── docs/
│   ├── detector.ts          7 signal-detection rules for doc impact
│   ├── generator.ts         DocTask generation with templates or LLM enrichment
│   ├── exporter.ts          Markdown/JSON export, docs-repo push
│   └── types.ts             DocSignal, DocTask, DocTaskSeverity types
├── git/
│   ├── ingestion.ts         git log + git show → Commit[]
│   └── normalizer.ts        Noise filtering, categorization, diff budget limiting → NormalizedCommit[]
├── integrations/
│   ├── extractor.ts         Linear/GitHub issue ref extraction from text and branch names
│   ├── types.ts             IssueRef, LinearIssue, EnrichedCommit, TicketGroup
│   └── linear/
│       └── client.ts        Linear SDK wrapper (fetchIssues, createIssue, listTeams)
│   └── mintlify/
│       ├── deploy.ts        MintlifyDeployClient (trigger, poll, status)
│       ├── cache.ts         Local deployment record cache
│       └── types.ts         MintlifyStatusResponse, MintlifyDeployRecord types
├── llm/
│   ├── gemini.ts            GeminiProvider (summarize, rawPrompt)
│   └── prompts.ts           buildSummarizationPrompt, buildDeploymentSummaryPrompt
└── report/
    ├── generator.ts         generateReport, buildTicketSection, buildDocsImpactSection
    ├── exporter.ts          exportReport, getLastReportPath, listAllReports
    └── html.ts              buildHtml (standalone styled HTML report)
```

## Architecture Principles

- **Command handlers orchestrate; domain modules do the work.** `run.ts` calls `ingestCommits`, `normalizeDiff`, `GeminiProvider.summarize`, `generateReport`, `exportReport` — it never touches git or file I/O directly.
- **Git ingestion and LLM prompting are separate.** `ingestion.ts` only runs git commands. `prompts.ts` only builds strings. Neither knows about the other.
- **Report generation is separate from export.** `generator.ts` returns a `Report` object; `exporter.ts` writes files. This keeps HTML rendering, Markdown rendering, and file I/O decoupled.
- **Integrations are optional and isolated.** Removing `integrations/linear` would not break any other module. Same for Mintlify.

## Adding a New Command

1. Create `src/cli/commands/my-command.ts` and export a function.
2. Import it in `src/cli/index.ts` and register it with Commander.
3. Add tests if the logic is non-trivial.

Example skeleton:

```typescript
// src/cli/commands/my-command.ts
import { loadConfig } from '../../config/loader';

interface MyCommandOptions {
  flag?: boolean;
}

export async function myCommand(options: MyCommandOptions): Promise<void> {
  const config = loadConfig();
  // ...
}
```

```typescript
// src/cli/index.ts
import { myCommand } from './commands/my-command';

program
  .command('my-command')
  .description('Does something useful')
  .option('--flag', 'enable a thing')
  .action(async (options) => {
    await myCommand({ flag: options.flag });
  });
```

## Adding a Doc-Signal Detection Rule

Doc signals are detected in `src/docs/detector.ts`. Each rule implements:

```typescript
interface DetectionRule {
  name: string;
  severity: 'high' | 'medium' | 'low';
  category: DocTaskCategory;
  run: (commit: NormalizedCommit) => Array<{ file: string; pattern: string; diffHunk?: string }>;
}
```

Add your rule to the `RULES` array. The `run` method returns an empty array if the rule doesn't match, or one entry per detected file.

## Before Opening a PR

```bash
npm run typecheck
npm test
```

Both must pass with no errors.
