---
title: export
sidebar_label: export
sidebar_position: 7
---

# `export`

Re-export or open the last generated report.

```bash
daily-summary export [options]
```

## Flags

| Flag | Type | Description |
|---|---|---|
| `--date <YYYY-MM-DD>` | string | Target a specific report by date. Defaults to the most recent report. |
| `--open` | flag | Open the report in `$EDITOR` instead of printing the file path. |

## Examples

### Print the path of the latest report

```bash
daily-summary export
# → /Users/you/.daily-summary/reports/2026-05-18-myapp.md
```

### Open the latest report in your editor

```bash
daily-summary export --open
```

### Target a specific date

```bash
daily-summary export --date 2026-05-17
# → /Users/you/.daily-summary/reports/2026-05-17-myapp.md

daily-summary export --date 2026-05-17 --open
```

## Notes

- `export` does not re-generate the report — it simply locates and optionally opens the existing file.
- If no report is found, the command exits with an error and a hint to run `daily-summary run`.
- For a full list of available reports, use `daily-summary history`.
