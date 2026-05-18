---
title: mintlify
sidebar_label: mintlify
sidebar_position: 3
---

# `mintlify`

Trigger and track Mintlify documentation deployments from the CLI.

```bash
daily-summary mintlify <subcommand> [options]
```

## Prerequisites

You need a Mintlify API key and a project ID. Configure them with:

```bash
export MINTLIFY_API_KEY="mint_..."
export MINTLIFY_PROJECT_ID="your-project-id"
# or persist them:
daily-summary config set integrations.mintlify.apiKey "mint_..."
daily-summary config set integrations.mintlify.projectId "your-project-id"
```

---

## `mintlify trigger`

Trigger a new Mintlify deployment and (by default) poll until it completes.

```bash
daily-summary mintlify trigger [options]
```

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--production` | flag | — | Deploy to the live production site. Without this flag, a preview deployment is triggered. |
| `--branch <name>` | string | current branch | Branch name for preview deployments. Auto-detected from the repo if not specified. |
| `--project-id <id>` | string | config | Mintlify project ID. Overrides config and `MINTLIFY_PROJECT_ID`. |
| `--fire-and-forget` | flag | — | Print the `statusId` and exit immediately without polling. |

### Examples

```bash
# Preview deploy on current branch (polls to completion)
daily-summary mintlify trigger

# Production deploy
daily-summary mintlify trigger --production

# Preview on a specific branch
daily-summary mintlify trigger --branch feature/new-api-docs

# Kick off a deploy and exit immediately (for CI pipelines)
daily-summary mintlify trigger --production --fire-and-forget
```

### Sample Output

```
Triggering Mintlify preview deployment (branch: feature/new-api-docs)...

  Deploying... [in_progress] 00:12

  Status ID: 64a2fc3e8a0b12d3e4f56789
  Status:    success (00:28)
  Site:      myapp.mintlify.app
  Preview:   https://preview.mintlify.app/myapp/feature-new-api-docs
  Summary:   Deployed successfully
  Files:     +3 ~7 -1

  Deployment cached. Run: daily-summary mintlify history
```

---

## `mintlify status`

Check the status of any deployment by its status ID.

```bash
daily-summary mintlify status <statusId> [options]
```

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--project-id <id>` | string | config | Mintlify project ID. |

### Example

```bash
daily-summary mintlify status 64a2fc3e8a0b12d3e4f56789
```

### Sample Output

```
Deployment Status

  ✓ statusId            64a2fc3e8a0b12d3e4f56789
  ● status              success
  ✓ subdomain           myapp.mintlify.app
  ✓ summary             Deployed successfully
  ✓ created             2026-05-18T10:22:14.000Z
  ✓ ended               2026-05-18T10:22:42.000Z
  ✓ commit              1aa6217 "docs: add OAuth2 provider reference"
  ✓ files changed       +3 ~7 -1
```

---

## `mintlify history`

List cached deployment records.

```bash
daily-summary mintlify history [options]
```

Records are stored locally at `~/.daily-summary/mintlify-deployments.json`.

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--limit <n>` | number | `20` | Number of records to display. |

### Sample Output

```
StatusId                  Date           Mode        Branch                  Status   Location
─────────────────────────────────────────────────────────────────────────────────────────────────
64a2fc3e8a0b12d3e4f56789  2026-05-18 10:22  preview     feature/new-api-docs    success  https://preview.mintlify.app/...
3b9e1a2c7d4f0e8b5c6a9f1d  2026-05-17 14:05  production  —                       success  myapp.mintlify.app
1f3e2d4b6c8a0e7f9b2d4c6a  2026-05-17 09:33  preview     fix/broken-links        failure  https://preview.mintlify.app/...
```

:::tip Fire-and-forget deployments appear immediately
When `--fire-and-forget` is used, the `statusId` is saved to the cache right away with `finalStatus: queued`. It will appear in `mintlify history` before the deployment completes — the record updates to `success` or `failure` automatically in the background.
:::

---

## `mintlify summary`

Summarise Mintlify deployments over a time window using Gemini.

```bash
daily-summary mintlify summary [options]
```

### Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--since <duration>` | string | `24h` | Time window: `24h`, `7d`, `1w`, etc. |
| `--raw` | flag | — | Print a raw file-change table without calling the LLM. |
| `--project-id <id>` | string | config | Used to back-fill missing file-change data via the Mintlify status API. |

### Example

```bash
daily-summary mintlify summary --since 7d
```

### Sample Output

```
Mintlify Docs Summary — last 7d
4 deployment(s): 3 preview · 1 production

Date              Mode        Branch              Status
────────────────────────────────────────────────────────
2026-05-18 10:22  preview     feature/new-api     success
2026-05-17 14:05  production  —                   success
2026-05-16 09:33  preview     fix/nav-links       success
2026-05-15 16:48  preview     fix/nav-links       failure

Summary
----------------------------------------
- Added OAuth2 provider API reference and usage examples to src/auth/provider.mdx
- Updated quickstart guide to reflect new PKCE flow steps
- Fixed 3 broken internal navigation links across the guides section
- Deployed 1 production release on 2026-05-17 covering all recent preview changes
```

:::info No file data?
If your deployments were triggered by API (not a GitHub push), Mintlify may not return commit data. In that case, `mintlify summary` summarises deployment activity (frequency, branches, mode) instead of file changes. Pass `--raw` to inspect the raw records.
:::
