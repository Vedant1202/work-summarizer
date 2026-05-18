---
title: doctor
sidebar_label: doctor
sidebar_position: 5
---

# `doctor`

Validate your configuration and test live API connectivity.

```bash
daily-summary doctor
```

Run `doctor` after initial setup or whenever a command fails unexpectedly — it checks every required and optional credential and performs live API pings so you know exactly what works.

## What It Checks

| Check | Required | What it verifies |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Key is set (any non-empty value) |
| `GEMINI_MODEL` | Yes | Model name is set |
| `LINEAR_API_KEY` | Optional | Key is set |
| `linear.teamId` | Optional | Team ID is set in config |
| `MINTLIFY_API_KEY` | Optional | Key is set |
| `mintlify.projectId` | Optional | Project ID is set |
| Gemini API (live) | Yes | Sends a test prompt; verifies a non-empty response |
| Linear API (live) | Optional | Lists teams; verifies connectivity and reports team keys |

## Sample Output

### Healthy setup with Linear

```
Checking configuration...
  ✓ GEMINI_API_KEY        set
  ✓ GEMINI_MODEL          gemini-3.1-flash-lite
  ✓ LINEAR_API_KEY        set
  ✓ linear.teamId         team-abc123

Checking Mintlify...
  - MINTLIFY_API_KEY      not set (optional — needed for mintlify trigger)
  - mintlify.projectId    not set (optional — needed for mintlify trigger)

Testing Gemini connection...
  ✓ Gemini API            reachable (gemini-3.1-flash-lite)

Testing Linear connection...
  ✓ Linear API            reachable — 2 team(s): ENG, DESIGN

Setup looks good. Run: daily-summary run --since 24h --no-edit
```

### Missing Gemini key

```
Checking configuration...
  ✗ GEMINI_API_KEY        not set — run: daily-summary config init
  ✗ GEMINI_MODEL          not set — run: daily-summary config init
  ...

Testing Gemini connection...
  - Gemini API            skipped (missing key or model)

Setup incomplete. Run: daily-summary config init
```

## Output symbols

| Symbol | Meaning |
|---|---|
| `✓` | Pass — configured and working |
| `✗` | Fail — required field missing or API call failed |
| `-` | Skip — optional, not configured |

## Tip: New Linear teams

When Linear is configured but `teamId` is not yet set, `doctor` prints the team IDs it found so you can copy the right one:

```
  Tip: save your team ID with:
    daily-summary config set integrations.linear.teamId team-abc123  # Engineering
    daily-summary config set integrations.linear.teamId team-xyz789  # Design
```
