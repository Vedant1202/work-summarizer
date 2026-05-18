---
id: installation
title: Installation
sidebar_label: Installation
sidebar_position: 2
---

# Installation

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | Check with `node --version` |
| Git | any | Must be on `PATH` |
| Gemini API key | — | [Get one free at Google AI Studio](https://aistudio.google.com/apikey) |

## Install from npm

```bash
npm install -g daily-commit-summarizer
```

Verify the install:

```bash
daily-summary --version
```

## Set Up Credentials

Run the interactive setup wizard:

```bash
daily-summary config init
```

The wizard prompts for your Gemini API key, model name, and optionally a Linear API key. It saves everything to `~/.daily-summary/.env`.

```
Welcome to daily-summary setup.

Config will be saved to: ~/.daily-summary/.env

  Gemini API key (https://aistudio.google.com/apikey): AIza...
  Gemini model name [default: gemini-2.0-flash-lite]:
  Linear API key (optional — press Enter to skip):

Config saved to ~/.daily-summary/.env

Next: run  daily-summary doctor  to verify your setup.
```

Alternatively, export variables directly in your shell:

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-2.0-flash-lite"
```

## Verify the Setup

```bash
daily-summary doctor
```

A healthy setup looks like:

```
Checking configuration...
  ✓ GEMINI_API_KEY        set
  ✓ GEMINI_MODEL          gemini-2.0-flash-lite
  - LINEAR_API_KEY        not set (optional — needed for --with-linear)
  - linear.teamId         not set (optional — needed for --create-issues)

Checking Mintlify...
  - MINTLIFY_API_KEY      not set (optional — needed for mintlify trigger)
  - mintlify.projectId    not set (optional — needed for mintlify trigger)

Testing Gemini connection...
  ✓ Gemini API            reachable (gemini-2.0-flash-lite)

Testing Linear connection...
  - Linear API            skipped (no key)

Setup looks good. Run: daily-summary run --since 24h --no-edit
```

## Run Your First Report

```bash
daily-summary run --repo /path/to/your-project --since 24h --no-edit
```

Reports are saved to `~/.daily-summary/reports/` by default.

---

## Install from Source

Use this path when contributing or evaluating the project locally.

```bash
git clone https://github.com/vedantnandoskar/daily-commit-summarizer.git
cd daily-commit-summarizer
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-lite
```

Run without building:

```bash
npm run dev -- doctor
npm run dev -- run --repo . --since 24h --no-edit
```

Build and run the compiled binary:

```bash
npm run build
npm start -- run --repo . --since 24h --no-edit
```

Link for local CLI-style testing:

```bash
npm link
daily-summary doctor
```

## Updating

```bash
npm update -g daily-commit-summarizer
```
