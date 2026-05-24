---
title: Config Files
sidebar_label: Config Files
sidebar_position: 3
---

# Config Files

## Repo-local — `.work-summary.json`

Place this in the root of any git repository to set project-specific defaults. Commit it to share settings with teammates.

```bash
work-summary config set branch main        # creates or updates .work-summary.json
work-summary config set timeWindow 48h
```

### Full example with annotations

```json
{
  "branch": "main",
  "timeWindow": "24h",
  "repoPath": ".",

  "excludePaths": [
    "**/package-lock.json",
    "**/*.snap",
    "coverage/",
    "e2e/"
  ],

  "focusAreas": [
    "src/",
    "api/"
  ],

  "llm": {
    "summaryLength": "medium"
  },

  "output": {
    "format": "both",
    "dir": "~/.work-summary/reports"
  },

  "integrations": {
    "linear": {
      "teamId": "team-abc123"
    },
    "docsRepo": {
      "path": "/Users/you/Projects/my-docs",
      "outputDir": "doc-tasks",
      "autoCommit": false
    }
  }
}
```

### Key reference

| Key | Type | Description |
|---|---|---|
| `branch` | string | Branch for `git log`. |
| `timeWindow` | string | Commit window: `30m`, `24h`, `2d`, `1w`, or a git date string. |
| `repoPath` | string | Default repo path when `--repo` is not passed. |
| `excludePaths` | string[] | Glob patterns or substrings. Matching files are stripped from diffs and commit changed-file lists. |
| `focusAreas` | string[] | Patterns or substrings. Commits that touch **none** of these paths are skipped entirely. |
| `llm.summaryLength` | `short\|medium\|long` | Controls Gemini output length. |
| `output.format` | `markdown\|html\|both` | Default report format. |
| `output.dir` | string | Report output directory. `~` is expanded. |
| `integrations.linear.teamId` | string | Linear team ID required for `docs --create-issues`. |
| `integrations.docsRepo.path` | string | Path to a local documentation repository. |
| `integrations.docsRepo.outputDir` | string | Subdirectory inside the docs repo. Defaults to `doc-tasks`. |
| `integrations.docsRepo.autoCommit` | boolean | If `true`, `docs push` creates a git commit automatically. |

---

## Global — `~/.work-summary/config.json`

Use this for non-secret preferences you want across all repos. Written by `work-summary config set --global`.

```json
{
  "llm": {
    "summaryLength": "medium"
  },
  "output": {
    "dir": "~/.work-summary/reports",
    "format": "markdown"
  }
}
```

---

## Global env — `~/.work-summary/.env`

Written by `work-summary config init`. Contains API keys and the model name.

```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.1-flash-lite
LINEAR_API_KEY=lin_api_...
MINTLIFY_API_KEY=mint_...
MINTLIFY_PROJECT_ID=my-project
```

This file is loaded automatically on every command. Shell-exported variables take precedence over values in this file.

---

## `excludePaths` vs `focusAreas`

| Option | Effect |
|---|---|
| `excludePaths` | Strips matching files from the diff content shown to Gemini and the changed-files list. The commit itself is still included. |
| `focusAreas` | Drops entire commits where no changed file matches any pattern. Useful for monorepos where you only care about a specific subdirectory. |

Both options support glob patterns (`*`, `**`, `?`) and plain substrings.
