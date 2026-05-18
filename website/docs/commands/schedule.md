---
title: schedule
sidebar_label: schedule
sidebar_position: 8
---

# `schedule`

Set up an automated daily run of `daily-summary run --no-edit`.

```bash
daily-summary schedule [options]
```

## Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--time <HH:MM>` | string | `08:00` | Time of day to run the report, in 24-hour format. |
| `--remove` | flag | — | Remove the scheduled job. |

## macOS (LaunchAgent)

On macOS, `schedule` writes a LaunchAgent plist to:

```
~/Library/LaunchAgents/com.daily-summary.plist
```

```bash
# Schedule at 08:30 every day
daily-summary schedule --time 08:30
```

Output:

```
LaunchAgent written to: ~/Library/LaunchAgents/com.daily-summary.plist
Scheduled: daily-summary run --no-edit at 08:30 every day

To activate, run:
  launchctl load "~/Library/LaunchAgents/com.daily-summary.plist"

To remove later:
  daily-summary schedule --remove
```

After running `launchctl load`, the job activates immediately and will fire every day at the configured time.

### Logs

Output is written to:

```
~/.daily-summary/logs/daily-summary.log
~/.daily-summary/logs/daily-summary-error.log
```

### Removing the job

```bash
daily-summary schedule --remove
```

This unloads the LaunchAgent and deletes the plist.

---

## Linux / other (crontab)

On non-macOS systems, `schedule` prints a crontab line for you to add manually:

```bash
daily-summary schedule --time 08:00
```

Output:

```
Add this line to your crontab (run `crontab -e`):

  0 8 * * * /usr/local/bin/daily-summary run --no-edit >> ~/.daily-summary/logs/daily-summary.log 2>&1

To remove, run `crontab -e` and delete that line.
```

To remove:

```bash
crontab -e
# delete the daily-summary line, save and exit
```

---

## Notes

- The scheduled command always runs with `--no-edit` (non-interactive). The report is written to `~/.daily-summary/reports/` silently.
- The binary path is auto-detected from `which daily-summary`. If detection fails, it falls back to the Node executable directory.
- The scheduled run picks up configuration from `~/.daily-summary/.env` and `~/.daily-summary/config.json`, so make sure your global setup is correct: `daily-summary doctor`.
