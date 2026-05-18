---
title: Linear
sidebar_label: Linear
sidebar_position: 1
---

# Linear Integration

`daily-summary` integrates with Linear in two ways:

1. **Report enrichment** — `run --with-linear` groups commits by Linear issue with status, priority, and sprint data.
2. **Doc-task issue creation** — `docs --create-issues` creates a Linear issue for each accepted documentation task.

## Setup

### 1. Get a Linear API key

Go to [Linear → Settings → Account → Security](https://linear.app/settings/account/security) and generate a personal API key.

### 2. Configure it

```bash
daily-summary config init
# or
export LINEAR_API_KEY="lin_api_..."
```

### 3. (Optional) Set your team ID

Required for `docs --create-issues`. If you haven't set it yet, `doctor` will print the team IDs it finds:

```bash
daily-summary doctor

# Output:
#   Tip: save your team ID with:
#     daily-summary config set integrations.linear.teamId team-abc123  # Engineering
```

Then:

```bash
daily-summary config set integrations.linear.teamId team-abc123
```

---

## Report Enrichment (`run --with-linear`)

```bash
daily-summary run --since 7d --with-linear --no-edit
```

### How issue refs are extracted

The tool scans two sources:

| Source | Examples |
|---|---|
| Commit message | `Fixes ENG-123`, `closes ENG-456`, bare `ENG-789` |
| Branch name | `feature/ENG-123-add-oauth`, `ENG-456/fix-bug` |

Closing keyword variants (`fixes`, `fixed`, `closes`, `closed`, `resolves`, `resolved`) are detected and preserved. GitHub-style refs (`#42`) are also extracted but only used for display — they are not fetched from Linear.

### "By Issue" section

When issues are found, the report gains a **By Issue** section:

```markdown
## By Issue

### [ENG-412: Add OAuth2 support](https://linear.app/org/issue/ENG-412) _(In Progress · High)_
- `1aa6217` feat: add OAuth2 provider with PKCE (+145/-12)
- `b3e89f1` feat: add PKCE verifier utility (+23/-0)

### [ENG-398: Fix null pointer in search](https://linear.app/org/issue/ENG-398) _(Done · Medium)_
- `c4d2109` fix: null check in search endpoint (+5/-2)

### Unlinked commits
- `d9e12aa` chore: upgrade Node to v20.10 LTS (+3/-3)
```

Commits without a matching Linear issue are grouped under **Unlinked commits** at the bottom.

### Metadata shown per issue

- Title and URL (linked)
- Status (e.g., In Progress, Done, Cancelled)
- Priority (Urgent, High, Medium, Low)
- Sprint / cycle number and title (if assigned)

---

## Doc-Task Issue Creation (`docs --create-issues`)

```bash
daily-summary docs --since 7d --create-issues
```

After the interactive review, the tool prompts once per accepted task:

```
  Create Linear issue for: "Add API reference for new export: OAuthProvider" (y/n) >
```

If confirmed, it creates the issue in your team with:

- **Title** — the doc task title
- **Description** — commit SHA, trigger file, and action items formatted as a checklist
- **Priority** — mapped from task severity (HIGH → 2, MED → 3, LOW → 4)

A link to the created issue is stored in the exported doc-task JSON and shown on screen:

```
  ✓ Created ENG-423: https://linear.app/org/issue/ENG-423
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Linear API error: 401` | Check your `LINEAR_API_KEY` is valid and not expired. |
| `--with-linear` shows no issue data | Commit messages or branch name don't contain Linear identifiers (`TEAM-NNN`). |
| `--create-issues` warns about missing teamId | Run `daily-summary doctor` to find your team ID, then `config set integrations.linear.teamId`. |
