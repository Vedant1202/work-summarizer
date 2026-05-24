---
title: export
sidebar_label: export
sidebar_position: 7
---

# `export`

Re-export or open the last generated report.

```bash
work-summary export [options]
```

## Flags

| Flag | Type | Description |
|---|---|---|
| `--date <YYYY-MM-DD>` | string | Target a specific report by date. Defaults to the most recent report. |
| `--open` | flag | Open the report in `$EDITOR` instead of printing the file path. |

## Examples

### Print the path of the latest report

```bash
work-summary export
# → /Users/you/.work-summary/reports/2026-05-18-myapp.md
```

### Open the latest report in your editor

```bash
work-summary export --open
```

### Target a specific date

```bash
work-summary export --date 2026-05-17
# → /Users/you/.work-summary/reports/2026-05-17-myapp.md

work-summary export --date 2026-05-17 --open
```

## Notes

- `export` does not re-generate the report — it simply locates and optionally opens the existing file.
- If no report is found, the command exits with an error and a hint to run `work-summary run`.
- For a full list of available reports, use `work-summary history`.
