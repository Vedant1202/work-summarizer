---
title: history
sidebar_label: history
sidebar_position: 6
---

# `history`

List all saved reports or open a specific one in `$EDITOR`.

```bash
daily-summary history [options]
```

## Flags

| Flag | Type | Description |
|---|---|---|
| `--last` | flag | Open the most recently generated report in `$EDITOR`. |
| `--open <date>` | `YYYY-MM-DD` | Open the report for a specific date in `$EDITOR`. |

## Examples

### List all reports

```bash
daily-summary history
```

```
Date        Repo       Commits  Path
──────────────────────────────────────────────────────────────────────────
2026-05-18  myapp      6        ~/.daily-summary/reports/2026-05-18-myapp.md
2026-05-17  myapp      3        ~/.daily-summary/reports/2026-05-17-myapp.md
2026-05-16  backend    11       ~/.daily-summary/reports/2026-05-16-backend.md
2026-05-15  myapp      2        ~/.daily-summary/reports/2026-05-15-myapp.md
```

### Open the latest report

```bash
daily-summary history --last
```

### Open a report by date

```bash
daily-summary history --open 2026-05-17
```

## Notes

- Reports must exist in the configured `output.dir` (default: `~/.daily-summary/reports/`).
- The commit count is parsed from the report content — it reflects the number of commits in the original scan.
- To change `$EDITOR`, set the environment variable: `export EDITOR=code` (VS Code), `export EDITOR=nano`, etc.
