---
title: docs
sidebar_label: docs
sidebar_position: 2
---

# `docs`

Detect commits that have documentation implications and review them interactively.

```bash
daily-summary docs [options]
daily-summary docs push [options]
```

## Flags

### `docs`

| Flag | Type | Default | Description |
|---|---|---|---|
| `--since <duration>` | string | `24h` | Time window to scan. |
| `--branch <name>` | string | config | Git branch to analyse. |
| `--repo <path>` | string | `.` | Path to the local git repository. |
| `--no-review` | flag | — | Auto-accept all detected tasks; skip interactive review. |
| `--format <fmt>` | `markdown\|json\|both` | `markdown` | Export format for accepted tasks. |
| `--no-llm` | flag | — | Use built-in template descriptions instead of calling Gemini for richer task text. |
| `--create-issues` | flag | — | Prompt to create a Linear issue for each accepted task. Requires `LINEAR_API_KEY` and a configured `teamId`. |

### `docs push`

Push saved doc-task files into a local documentation repository.

| Flag | Type | Default | Description |
|---|---|---|---|
| `--date <YYYY-MM-DD>` | string | today | Target a specific date's doc-task file. |
| `--repo <name>` | string | current dir name | Repo name used in the filename. |
| `--path <docs-repo>` | string | config | Path to the local docs repo. Overrides `integrations.docsRepo.path`. |
| `--auto-commit` | flag | config | Auto `git commit` after writing the file. |

## Detection Rules

The tool runs 7 signal-detection rules against each normalized commit:

| Rule | Severity | Trigger |
|---|---|---|
| `breaking-change` | **HIGH** | Commit message contains `BREAKING CHANGE`, `!:`, `deprecated`, `removed`, or `migration required` |
| `new-api` | **HIGH** | Diff adds a line matching `export function\|class\|interface\|const\|type\|enum` |
| `cli-option` | **HIGH** | A CLI file (`cli/`, `command/`, `cmd/`) gains a `.option()` or `.command()` call |
| `schema-change` | **HIGH** | Changed files match `migration`, `schema`, `prisma`, or `.sql` |
| `new-feature` | **MED** | `feat:` commit with ≥ 20 added lines |
| `config-change` | **MED** | Changed files are config/env related (`config.ts`, `.env.example`, `tsconfig*.json`) |
| `public-api-entry` | **MED** | `feat:` commit touches `index.ts` / `lib/index.ts` |

Higher-severity signals for the same commit+file pair replace lower-severity ones — you won't see duplicates.

## Interactive Review

Without `--no-review`, each detected task is shown one at a time:

```
┌──────────────────────────────────────────────────────┐
│  Doc Task 1 of 3  [HIGH] · new-api                   │
└──────────────────────────────────────────────────────┘

  Commit:  feat: add OAuth2 provider with PKCE
  File:    src/auth/provider.ts
  Signal:  A new public export requires API documentation.

  Add API reference for new export: OAuthProvider

  Action items:
    □ Add OAuthProvider to the API reference with type signature
    □ Add a realistic usage example showing a login flow
    □ Update README if this export is user-facing
    □ Add to CHANGELOG under Features

  [A]ccept  [R]eject  [E]dit  [S]kip  (a/r/e/s) >
```

| Key | Action |
|---|---|
| `a` | Accept — include in exported output |
| `r` | Reject — exclude from output |
| `e` | Edit — opens the task JSON in `$EDITOR`; saves as accepted |
| `s` | Skip — leaves the task in `pending` state (not exported) |

## LLM Enrichment

By default, `--llm` is on. Each task is sent to Gemini with the commit message, file name, detection reason, and a diff hunk, and Gemini returns a more specific title, description, and action items than the built-in template provides.

Use `--no-llm` to skip this and use templates — faster and works without a Gemini key.

## Examples

```bash
# Detect and review doc tasks from the last 7 days
daily-summary docs --since 7d

# Auto-accept everything, export both Markdown and JSON
daily-summary docs --since 7d --no-review --format both

# Use templates (no LLM), review, then create Linear issues
daily-summary docs --since 7d --no-llm --create-issues

# Push today's accepted tasks into a local docs repo
daily-summary docs push --path ~/Projects/my-docs --auto-commit
```

## Output

Accepted tasks are saved to `~/.daily-summary/doc-tasks/<date>-<repo>.md`:

```markdown
# Documentation Tasks — 2026-05-18

Generated from: **myapp** · `main` · last 7d
Accepted: **2** tasks

---

## [HIGH] Add API reference for new export: OAuthProvider

**Commit:** `1aa6217` feat: add OAuth2 provider with PKCE
**Category:** new-api
**File:** `src/auth/provider.ts`

A new public export requires API documentation.

### Action Items
- [ ] Add OAuthProvider to the API reference with type signature
- [ ] Add a realistic usage example showing a login flow
- [ ] Update README if this export is user-facing
- [ ] Add to CHANGELOG under Features

**Suggested files:** README.md, CHANGELOG.md

---
```

With `--format json`, a machine-readable `.json` file is also written alongside the Markdown.
