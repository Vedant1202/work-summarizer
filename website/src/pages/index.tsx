import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: React.ReactNode;
};

const features: FeatureItem[] = [
  {
    title: 'AI-Powered Stand-ups',
    emoji: '🤖',
    description: (
      <>
        Scans git commits for any time window and generates a polished,
        grouped stand-up summary using Gemini — categorised into features,
        fixes, refactors, and more.
      </>
    ),
  },
  {
    title: 'Linear Integration',
    emoji: '📋',
    description: (
      <>
        Enriches summaries with Linear issue metadata extracted from commit
        messages and branch names. Group commits by issue, see status,
        priority, and sprint — and create issues directly from the CLI.
      </>
    ),
  },
  {
    title: 'Doc-Task Detection',
    emoji: '📝',
    description: (
      <>
        Automatically detects commits that need documentation follow-up —
        new exports, CLI flags, breaking changes, schema changes — and
        generates a reviewable task list with LLM-enriched action items.
      </>
    ),
  },
  {
    title: 'Mintlify Deployments',
    emoji: '🚀',
    description: (
      <>
        Trigger, poll, and track Mintlify documentation deployments from
        the CLI. View deployment history, check status by ID, and get an
        AI-powered summary of what changed in your docs.
      </>
    ),
  },
  {
    title: 'Flexible Output',
    emoji: '📄',
    description: (
      <>
        Export reports as Markdown, styled HTML, or both. Reports are saved
        to <code>~/.daily-summary/reports/</code> and accessible via
        the <code>history</code> and <code>export</code> commands.
      </>
    ),
  },
  {
    title: 'Zero Config to Start',
    emoji: '⚡',
    description: (
      <>
        Run <code>daily-summary config init</code> for a 30-second setup
        wizard, then <code>daily-summary run</code>. Supports repo-local and
        global config files for team-wide defaults.
      </>
    ),
  },
];

function Feature({ title, emoji, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className={styles.featureEmoji}>{emoji}</div>
      <div className="padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        <div className={styles.quickInstall}>
          <code className={styles.installCmd}>npm install -g daily-commit-summarizer</code>
        </div>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/introduction">
            Get Started →
          </Link>
          <Link
            className={clsx('button button--outline button--lg', styles.buttonGhost)}
            to="https://github.com/vedantnandoskar/daily-commit-summarizer">
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="daily-commit-summarizer"
      description="CLI that turns git history into polished daily stand-up summaries using Gemini AI, with Linear integration and doc-task detection.">
      <HomepageHero />
      <main>
        <HomepageFeatures />
        <section className={styles.exampleSection}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <Heading as="h2">From git log to stand-up in seconds</Heading>
                <p>
                  Point <code>daily-summary run</code> at any local repo, choose your
                  time window, and get a structured report instantly. No server,
                  no account required — just a Gemini API key.
                </p>
                <ul>
                  <li>Works on any local git repository</li>
                  <li>Filters lock files, binaries, and build output automatically</li>
                  <li>Summarises features, fixes, refactors, tests, docs, and more</li>
                  <li>Exports Markdown and styled HTML</li>
                </ul>
                <Link className="button button--primary" to="/docs/installation">
                  Install in 2 minutes
                </Link>
              </div>
              <div className="col col--6">
                <pre className={styles.exampleOutput}>{`$ daily-summary run --since 24h --no-edit

Scanning commits on branch "main" since 24h...
Found 6 commit(s). Normalizing diffs...
Summarizing with gemini-2.0-flash-lite (medium)...
Report saved to: ~/.daily-summary/reports/2026-05-18-myapp.md

---

## Summary

**Features**
- Added OAuth2 provider support with PKCE flow
- Introduced rate-limiting middleware on all API routes

**Bug Fixes**
- Fixed null pointer in search endpoint when query is empty

**Chores**
- Upgraded Node.js runtime to v20.10 LTS`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
