# daily-commit-summarizer

A CLI that scans your local git history and generates a daily stand-up summary using Gemini AI. Run it every morning to get a professional, categorized summary of what you shipped — optionally enriched with Linear issue context.

```
## Summary

**Features**
- Added OAuth2 provider support with PKCE flow

**Bug Fixes**
- Prevented empty query errors in search endpoint

**Chores**
- Upgraded Node.js runtime to v20.10 LTS

## By Issue

### ENG-123: Add OAuth2 provider support _(In Progress · High)_
- `1aa6217` feat: add OAuth2 provider support (+45/-3)
```

---

## Requirements

- Node.js ≥ 18
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier works)
- `git` in your PATH

---

## Installation

```bash
npm install -g daily-commit-summarizer
```

Then run the setup wizard:

```bash
daily-summary config init
```

This prompts for your API keys and saves them to `~/.daily-summary/.env` so they're available from any directory.

---

## Quick Start

```bash
# 1. Install
npm install -g daily-commit-summarizer

# 2. Configure
daily-summary config init

# 3. Verify setup
daily-summary doctor

# 4. Generate your first report
cd ~/Projects/my-repo
daily-summary run --since 24h --no-edit
```

Your report is saved to `~/.daily-summary/reports/` as Markdown (and optionally HTML).

---

## Commands

| Command | Description |
|---|---|
| `daily-summary run` | Scan commits and generate a stand-up summary |
| `daily-summary docs` | Detect doc tasks from recent commits, review interactively |
| `daily-summary doctor` | Validate config and test API connectivity |
| `daily-summary config init` | Interactive first-time setup wizard |
| `daily-summary config show` | Print current merged config (API keys masked) |
| `daily-summary config set <key> <value>` | Set a config value |
| `daily-summary history` | List all saved reports |
| `daily-summary export` | Re-export the last generated report |
| `daily-summary schedule` | Set up automated daily runs |

### `run` options

```
--since <duration>   time window: 24h, 2d, 1w, etc.  (default: 24h)
--branch <name>      git branch to scan               (default: main)
--repo <path>        path to the repo to scan         (default: .)
--length <size>      short | medium | long            (default: medium)
--format <fmt>       markdown | html | both           (default: markdown)
--no-edit            skip editor review, export directly
--with-linear        enrich report with Linear issue data
```

### `docs` options

```
--since <duration>   time window                      (default: 24h)
--branch <name>      git branch to analyze
--repo <path>        path to the repo to analyze      (default: .)
--no-review          auto-accept all detected tasks
--format <fmt>       markdown | json | both           (default: markdown)
--no-llm             use templates instead of LLM
--create-issues      prompt to create a Linear issue per accepted task
```

---

## Configuration

Settings are loaded in this priority order (later wins):

1. `~/.daily-summary/.env` — global secrets (written by `config init`)
2. `.daily-summary.json` in the current repo — repo-level defaults (safe to commit)
3. `~/.daily-summary/config.json` — global non-secret config
4. Shell environment variables — highest priority, override everything

### Key names

| Key | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | env / `.env` | Required for `run` and `docs` with LLM |
| `GEMINI_MODEL` | env / `.env` | Model name (default: `gemini-2.0-flash-lite`) |
| `LINEAR_API_KEY` | env / `.env` | Required for `--with-linear` and `--create-issues` |
| `llm.summaryLength` | config JSON | `short` / `medium` / `long` |
| `output.format` | config JSON | `markdown` / `html` / `both` |
| `branch` | config JSON | Default branch to scan |
| `timeWindow` | config JSON | Default time window, e.g. `24h` |
| `excludePaths` | config JSON | Array of glob patterns to exclude from diff analysis |
| `focusAreas` | config JSON | Array of path prefixes to prioritize |

**Example `.daily-summary.json`** (commit this to your repo):

```json
{
  "branch": "main",
  "timeWindow": "24h",
  "excludePaths": ["**/package-lock.json", "**/*.snap"],
  "focusAreas": ["src/", "api/"],
  "llm": { "summaryLength": "medium" },
  "output": { "format": "both" }
}
```

---

## Linear Integration

Enrich reports with issue titles, status, and priority from Linear.

### Setup

```bash
# 1. Add your Linear API key (Personal API key from Linear → Settings → Security)
daily-summary config init   # prompts for LINEAR_API_KEY

# 2. Get your team ID
daily-summary doctor        # lists teams if key is set

# 3. Save team ID (for --create-issues)
daily-summary config set integrations.linear.teamId <team-id>
```

### Usage

```bash
# Enrich run report with issue data
daily-summary run --since 7d --with-linear --no-edit

# Create Linear issues from doc tasks
daily-summary docs --since 7d --create-issues
```

Commits that mention `ENG-123`, `Fixes ENG-456`, etc. are automatically grouped under their Linear issue in the report. Commits with no issue refs appear under **Unlinked**.

---

## Docs Push

Export accepted doc tasks to a separate documentation repository.

```bash
# Configure the target repo
daily-summary config set integrations.docsRepo.path /path/to/docs-repo

# Push today's doc tasks
daily-summary docs push

# Push with auto git-commit in the target repo
daily-summary docs push --auto-commit
```

Or override the path inline:

```bash
daily-summary docs push --path ~/my-docs --auto-commit
```

---

## Scheduling

Set up an automatic daily run at 8:30 AM:

```bash
daily-summary schedule --time 08:30
```

On macOS this installs a launchd plist. On Linux it prints a crontab line to add manually. Remove the schedule with `--remove`.

---

## Scanning a Different Repo

Use `--repo` to point at any local repository without changing config:

```bash
daily-summary run --repo ~/Projects/backend-api --since 7d --no-edit
daily-summary docs --repo ~/Projects/backend-api --since 7d --no-review
```

---

## Troubleshooting

Run `daily-summary doctor` first — it checks all required config and tests API connectivity.

| Error | Fix |
|---|---|
| `GEMINI_API_KEY is not set` | Run `daily-summary config init` or `export GEMINI_API_KEY=...` |
| `GEMINI_MODEL is not set` | Run `daily-summary config init` or `export GEMINI_MODEL=gemini-2.0-flash-lite` |
| `No commits found` | Try a longer window: `--since 7d`, or check `--branch` matches your default branch |
| Linear warning on `--with-linear` | Set `LINEAR_API_KEY` via `config init` |

---

## License

MIT
