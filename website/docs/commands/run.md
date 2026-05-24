---
title: run
sidebar_label: run
sidebar_position: 1
---

# `run`

Scan commits in a git repository and generate an AI-powered stand-up summary.

```bash
daily-summary run [options]
```

## Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--since <duration>` | string | `24h` | Time window to scan. Supports `30m`, `24h`, `2d`, `1w`, or any git-compatible date string (e.g. `"2026-05-01"`). |
| `--branch <name>` | string | config (`main`) | Git branch passed to `git log`. |
| `--repo <path>` | string | `.` | Path to the local git repository to scan. |
| `--length <size>` | `short\|medium\|long` | `medium` | Controls how detailed the Gemini summary is. |
| `--format <fmt>` | `markdown\|html\|both` | `markdown` | Output format for the saved report. |
| `--no-edit` | flag | — | Skip the `$EDITOR` review step and export the report immediately. |
| `--with-linear` | flag | — | Fetch Linear issue metadata and add a "By Issue" section. Requires `LINEAR_API_KEY`. |

## Summary Lengths

| Length | Output style |
|---|---|
| `short` | 3–5 bullets, most impactful changes only, no section headers |
| `medium` | Grouped by category (Features → Bug Fixes → …), 2–4 bullets each |
| `long` | Opens with a 2-sentence theme paragraph, then detailed sections with up to 8 bullets, file-level context included |

## Examples

### Basic — last 24 hours

```bash
daily-summary run --since 24h --no-edit
```

### Scan a different repo, last week, HTML output

```bash
daily-summary run --repo ~/Projects/backend-api --since 7d --format both --no-edit
```

### With Linear issue enrichment

```bash
daily-summary run --since 1w --with-linear --no-edit
```

### Review in editor before saving

```bash
daily-summary run --since 24h --length long
```

Opens the generated report in `$EDITOR`. Save and close to export; cancel by exiting without changes and answering `n` at the prompt.

## Sample Output

```markdown
# Daily Stand-up — 2026-05-18

**Repo:** myapp | **Branch:** main | **Period:** last 24h | **Commits:** 6

---

## Summary

**Features**
- Added OAuth2 provider support with PKCE flow – enables social login via Google and GitHub
- Introduced rate-limiting middleware on all API routes – prevents abuse without impacting normal usage

**Bug Fixes**
- Fixed null pointer in search endpoint when query is empty
- Resolved race condition in session refresh logic

**Chores & Maintenance**
- Upgraded Node.js runtime to v20.10 LTS
- Bumped @types/node to match runtime version

---

## Commits by Category

### Features
- `1aa6217` feat: add OAuth2 provider with PKCE (+145/-12)
- `b3e89f1` feat: add rate-limit middleware (+67/-0)

### Bug Fixes
- `c4d2109` fix: null check in search endpoint (+5/-2)
- `a8f3bc0` fix: race condition in session refresh (+18/-8)

### Chores & Maintenance
- `d9e12aa` chore: upgrade Node to v20.10 LTS (+3/-3)
- `f01bc44` chore: bump @types/node (+1/-1)

---

## By Issue

### [ENG-412: Add OAuth2 support](https://linear.app/org/issue/ENG-412) _(In Progress · High)_
- `1aa6217` feat: add OAuth2 provider with PKCE (+145/-12)
```

## AI Agent Detection

`run` automatically detects commits made with AI coding assistants and separates them into a dedicated section of the report. Detection is **commit-level**: a commit is classified as agent-assisted when it contains a `Co-Authored-By` trailer pointing to a known agent email, or when Aider's author-name convention is used.

| Agent | Detection method |
|---|---|
| **Claude Code** | `Co-Authored-By: ... <noreply@anthropic.com>` |
| **GitHub Copilot** | `Co-Authored-By: ... <noreply@github.com>` |
| **Cursor** | `Co-Authored-By: ... <noreply@cursor.com>` |
| **Codex** | `Co-Authored-By: ... <noreply@openai.com>` |
| **Aider** | Author name contains `(aider)` |

When agent-assisted commits are found, the report renders two summary sections — each with its own LLM-generated summary — instead of one unified section:

```markdown
## 👤 Human Commits

- Added OAuth2 provider support with PKCE flow
- Fixed null pointer in search endpoint

---

## 🤖 Agent-Assisted Commits

- Scaffolded Linear integration client and response types
- Generated unit tests for the normalizer module
```

When no agent commits are present, the report is identical to the single-section format above.

## With Linear — "By Issue" Section

When `--with-linear` is set, the report includes a **By Issue** section that groups commits by Linear ticket. Issue refs are extracted from:

- Commit messages: `Fixes ENG-123`, `closes ENG-456`, or bare `ENG-789`
- The current branch name: `feature/ENG-123-add-oauth`

Commits that don't reference any issue are collected under **Unlinked commits**.

## Doc-Impact Notice

If the tool detects commits that may need documentation updates, the report includes a **Docs Impact** table at the bottom:

```markdown
## Docs Impact

_2 areas may need documentation updates._

| Severity | Category   | File                  | Signal                        |
|----------|------------|-----------------------|-------------------------------|
| HIGH     | new-api    | src/auth/provider.ts  | new export: OAuthProvider      |
| MED      | cli-option | src/cli/commands/run.ts | new CLI option added          |

> Run `daily-summary docs` for a full interactive review.
```

## Output Location

Reports are saved to `~/.daily-summary/reports/` as `<date>-<repo-name>.md` (and `.html` when applicable). View them with:

```bash
daily-summary history        # list all reports
daily-summary history --last # open the most recent
```
