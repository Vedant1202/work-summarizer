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
npm install -g work-summarizer
```

Verify the install:

```bash
work-summary --version
```

## Set Up Credentials

Run the interactive setup wizard:

```bash
work-summary config init
```

The wizard prompts for your Gemini API key, model name, and optionally a Linear API key and Mintlify credentials. It saves everything to `~/.work-summary/.env`.

```
Welcome to work-summary setup.

Config will be saved to: ~/.work-summary/.env

  Gemini API key (https://aistudio.google.com/apikey): AIza...
  Gemini model name [default: gemini-3.1-flash-lite]:
  Linear API key (optional — press Enter to skip):
  Mintlify API key (optional — press Enter to skip):
  Mintlify project ID (optional — press Enter to skip):

Config saved to ~/.work-summary/.env

Next: run  work-summary doctor  to verify your setup.
```

Alternatively, export variables directly in your shell:

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-3.1-flash-lite"
```

## Verify the Setup

```bash
work-summary doctor
```

A healthy setup looks like:

```
Checking configuration...
  ✓ GEMINI_API_KEY        set
  ✓ GEMINI_MODEL          gemini-3.1-flash-lite
  - LINEAR_API_KEY        not set (optional — needed for --with-linear)
  - linear.teamId         not set (optional — needed for --create-issues)

Checking Mintlify...
  - MINTLIFY_API_KEY      not set (optional — needed for mintlify trigger)
  - mintlify.projectId    not set (optional — needed for mintlify trigger)

Testing Gemini connection...
  ✓ Gemini API            reachable (gemini-3.1-flash-lite)

Testing Linear connection...
  - Linear API            skipped (no key)

Setup looks good. Run: work-summary run --since 24h --no-edit
```

## Run Your First Report

```bash
work-summary run --repo /path/to/your-project --since 24h --no-edit
```

Reports are saved to `~/.work-summary/reports/` by default.

---

## Install from Source

Use this path when contributing or evaluating the project locally.

```bash
git clone https://github.com/Vedant1202/work-summarizer.git
cd work-summarizer
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
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
work-summary doctor
```

## Updating

```bash
npm update -g work-summarizer
```
