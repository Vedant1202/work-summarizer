---
title: Prompt Templates
sidebar_label: Prompt Templates
sidebar_position: 4
---

# Prompt Templates

By default, `daily-summary` uses a built-in prompt tuned for Gemini. You can replace it with your own Mustache template to change the tone, structure, or add team-specific context — and the same template works with any LLM provider.

## Quick Start

1. Create a template file, e.g. `~/.daily-summary/my-prompt.mustache`
2. Set `llm.promptTemplate` in your config:

```bash
daily-summary config set llm.promptTemplate ~/.daily-summary/my-prompt.mustache --global
```

Or directly in `~/.daily-summary/config.json`:

```json
{
  "llm": {
    "promptTemplate": "~/.daily-summary/my-prompt.mustache"
  }
}
```

---

## Template Variables

Templates are rendered with [Mustache](https://mustache.github.io/). The following variables are available:

### Pre-built strings (drop-in replacements)

| Variable | Type | Description |
|---|---|---|
| `{{{systemRules}}}` | string | The default system rules block (voice, style, quality bar). Use triple braces to avoid HTML escaping. |
| `{{{lengthInstructions}}}` | string | The format instructions for the selected `summaryLength` (short / medium / long). |
| `{{{commitBlock}}}` | string | All commits pre-formatted and grouped by category. |

### Scalar values

| Variable | Type | Description |
|---|---|---|
| `{{summaryLength}}` | string | `short`, `medium`, or `long` |
| `{{commitCount}}` | number | Total number of commits in the scan |

### Commit list

Iterate over raw commits with `{{#commits}}...{{/commits}}`:

| Variable | Type | Description |
|---|---|---|
| `{{sha7}}` | string | First 7 characters of the commit SHA |
| `{{message}}` | string | Commit message |
| `{{category}}` | string | `feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`, or `other` |
| `{{insertions}}` | number | Lines added |
| `{{deletions}}` | number | Lines removed |
| `{{diff}}` | string | Diff content (may be truncated for large commits) |

---

## Default Template

The built-in template is equivalent to:

```mustache
{{{systemRules}}}

---

OUTPUT FORMAT:
{{{lengthInstructions}}}

---

COMMITS (pre-classified by type):

{{{commitBlock}}}

---

Write the stand-up summary now. Follow the format and rules above exactly.
```

This is a good starting point to copy and modify.

---

## Example Templates

### Slack-style

Short, emoji-prefixed bullets formatted for pasting into Slack.

```mustache
You are writing a daily engineering stand-up for a Slack message.
Keep it short — 3 to 6 bullets max. Use past tense. Use emoji prefixes:
🚀 for features, 🐛 for bug fixes, 🔧 for chores/refactors, 📝 for docs.
No section headers. No preamble.

Commits ({{commitCount}} total):

{{#commits}}
- [{{category}}] {{sha7}} {{message}} (+{{insertions}}/-{{deletions}})
{{/commits}}

Write the Slack message now.
```

### Manager brief

A 2–3 sentence executive summary, no bullet points.

```mustache
{{{systemRules}}}

Write a 2–3 sentence plain-English summary of today's engineering work.
Audience: non-technical engineering manager. No bullet points, no commit SHAs.
Focus on business impact and progress, not implementation details.

{{#commits}}
[{{category}}] {{message}}
{{/commits}}
```

### Conventional commit log

Keep the LLM out of it entirely — just format the raw commits.

```mustache
## Changes — {{commitCount}} commit(s)

{{#commits}}
- `{{sha7}}` **{{category}}**: {{message}} (+{{insertions}}/-{{deletions}})
{{/commits}}
```

---

## Tips

- Use `{{{ }}}` (triple braces) for variables that contain newlines or special characters to prevent Mustache's HTML escaping.
- The `promptTemplate` path supports `~` expansion (e.g. `~/my-template.mustache`).
- Share templates across your team by committing the template file and setting `llm.promptTemplate` in `.daily-summary.json`.
- Different models respond differently — a template tuned for GPT-4 may need adjustment for Llama or Mistral.
