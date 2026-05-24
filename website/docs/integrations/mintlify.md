---
title: Mintlify
sidebar_label: Mintlify
sidebar_position: 2
---

# Mintlify Integration

`work-summary` can trigger, poll, and track [Mintlify](https://mintlify.com) documentation deployments from the CLI. Deployment records are cached locally and can be summarised with Gemini.

## Setup

### 1. Get your credentials

- **API key** — Mintlify dashboard → Settings → API key (starts with `mint_`)
- **Project ID** — Mintlify dashboard → your project's settings page

### 2. Configure them

**Option A — `config init` (recommended)**

```bash
work-summary config init
```

The setup wizard prompts for `MINTLIFY_API_KEY` and `MINTLIFY_PROJECT_ID` alongside your other credentials and saves them to `~/.work-summary/.env`.

**Option B — manual**

```bash
export MINTLIFY_API_KEY="mint_..."
export MINTLIFY_PROJECT_ID="my-project-id"
# or persist:
work-summary config set integrations.mintlify.apiKey "mint_..."
work-summary config set integrations.mintlify.projectId "my-project-id"
```

---

## Triggering Deployments

### Preview deployment (default)

```bash
work-summary mintlify trigger
```

Uses the current branch (auto-detected from git). Polls until the deployment finishes and prints the result.

### Production deployment

```bash
work-summary mintlify trigger --production
```

### CI / fire-and-forget

For CI pipelines where you don't want to block on the result:

```bash
work-summary mintlify trigger --production --fire-and-forget
# Output:
#   statusId:   64a2fc3e8a0b12d3e4f56789
#   previewUrl: https://preview.mintlify.app/...
```

The `statusId` is saved to `~/.work-summary/mintlify-deployments.json` immediately with `finalStatus: queued`. The record updates to `success` or `failure` in the background once polling completes — so `mintlify history` always reflects in-progress deployments.

You can check the result later:

```bash
work-summary mintlify status 64a2fc3e8a0b12d3e4f56789
```

---

## Deployment Cache

Every completed `mintlify trigger` run appends a record to:

```
~/.work-summary/mintlify-deployments.json
```

Each record stores the status ID, project ID, trigger time, mode, branch, final status, subdomain, Mintlify summary, and file-change data.

View the cache:

```bash
work-summary mintlify history
work-summary mintlify history --limit 50
```

---

## LLM Deployment Summary

```bash
work-summary mintlify summary --since 7d
```

Gemini reads the cached deployment records for the time window and produces a bullet-point summary of what changed in the docs. If file-change data is available, it names specific files and sections:

```
- Added OAuth2 provider API reference and usage examples to src/auth/provider.mdx
- Updated quickstart guide to reflect new PKCE flow steps
- Fixed 3 broken internal navigation links across the guides section
- Deployed 1 production release covering all recent preview changes
```

:::note File data availability
File-change data (`filesChanged`) is only present when the deployment was triggered by a GitHub push that Mintlify processed. For API-triggered deployments, Mintlify does not expose commit details. In that case, the summary focuses on deployment activity (how many, when, which branch) instead of file changes.

Pass `--raw` to skip the LLM and print the raw file table instead.
:::

---

## Workflow Example

A typical docs-update workflow:

```bash
# 1. Make doc changes, push branch
git push origin feature/new-api-docs

# 2. Trigger a preview deploy
work-summary mintlify trigger --branch feature/new-api-docs

# 3. Review the preview URL printed in the output
# 4. Once approved, deploy to production
work-summary mintlify trigger --production

# 5. Get an AI summary of this week's doc changes
work-summary mintlify summary --since 7d
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `MINTLIFY_API_KEY is not set` | Export the variable or run `work-summary config set integrations.mintlify.apiKey`. |
| `Mintlify project ID is not set` | Pass `--project-id <id>` or run `work-summary config set integrations.mintlify.projectId`. |
| `Could not determine branch for preview` | Pass `--branch <name>` explicitly. |
| Deploy times out | The default timeout is 5 minutes. For large sites, check the Mintlify dashboard and use `mintlify status` to poll manually. |
| No file data in summary | Deployment was API-triggered; Mintlify doesn't expose commit data for these. Use `--raw` for activity-level output. |
