---
title: ui
sidebar_label: ui
sidebar_position: 2
---

# `ui`

Start a local web interface for `work-summarizer`. The UI exposes all of the CLI's features in a browser-based dashboard — no flags required.

```bash
work-summary ui
```

The server starts on **port 7331** and automatically opens `http://localhost:7331` in your default browser. Press `Ctrl+C` to stop it.

---

## What the UI Includes

| Page | What you can do |
|------|----------------|
| **Dashboard** | Trigger a run with the same options as `work-summary run` (time window, branch, repo, format, length, Linear enrichment). Pre-filled from your config. |
| **Reports** | Browse all saved reports, click to open one, and read it with full Markdown rendering. |
| **Config** | View and edit all configuration fields including API keys for Gemini, Linear, and Mintlify. |
| **Mintlify** | Trigger preview or production deployments, browse deployment history, check a deployment's status by ID, and generate an LLM summary of recent activity. |
| **Doctor** | Run the same health checks as `work-summary doctor`. |

---

## Example

```bash
work-summary ui
# work-summary UI  →  http://localhost:7331
```

If port 7331 is already in use, the command exits with an error. Stop the existing instance first.

---

## Notes

- The UI reads and writes the same config files and report cache as the CLI — they share state.
- API keys entered in the Config page are saved to `~/.work-summary/config.json` (global) or `.work-summary.json` (repo-local), the same as `work-summary config set`.
- The server does not require authentication — only run it on a trusted local network.
