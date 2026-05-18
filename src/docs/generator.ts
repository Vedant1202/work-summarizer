import fs from 'fs';
import path from 'path';
import { GeminiProvider } from '../llm/gemini';
import { DocSignal, DocTask, DocTaskCategory } from './types';

// ── Template definitions ──────────────────────────────────────────────────────

interface TaskTemplate {
  titleFn: (file: string, signal: DocSignal) => string;
  description: string;
  actionItems: string[];
}

const TEMPLATES: Record<DocTaskCategory, TaskTemplate> = {
  'breaking-change': {
    titleFn: (file) => `Update CHANGELOG and migration guide for breaking change in \`${path.basename(file)}\``,
    description: 'A breaking change was detected. Consumers of this code need a migration path.',
    actionItems: [
      'Add a BREAKING CHANGE entry to CHANGELOG.md with the old and new behavior',
      'Write a migration guide explaining how to update call sites',
      'Flag the change in README if it affects a public-facing API',
      'Update any relevant usage examples to reflect the new interface',
    ],
  },
  'new-api': {
    titleFn: (file, s) => `Document new exported symbol in \`${path.basename(file)}\` (${s.triggerPattern})`,
    description: 'New public symbols were exported. They need API documentation.',
    actionItems: [
      'Add the new export to the API reference with a description and type signature',
      'Add at least one usage example showing a realistic call',
      'Update README if this export is user-facing',
      'Add to CHANGELOG under the Features section',
    ],
  },
  'cli-option': {
    titleFn: (file) => `Document new CLI option or command added in \`${path.basename(file)}\``,
    description: 'A new CLI flag or subcommand was added.',
    actionItems: [
      'Update the README "Usage" section with the new flag and its description',
      'Ensure the --help text accurately describes the option',
      'Add an example invocation to the docs',
      'Add to CHANGELOG under Features',
    ],
  },
  'config-change': {
    titleFn: (file) => `Document configuration changes in \`${path.basename(file)}\``,
    description: 'A config file or type was modified. Users may need to update their setup.',
    actionItems: [
      'Update the configuration reference with new or changed fields',
      'Add new fields to .env.example if they require environment variables',
      'Note any default value changes in CHANGELOG',
      'Update README setup instructions if the change affects onboarding',
    ],
  },
  'schema-change': {
    titleFn: (file) => `Write migration guide for schema change in \`${path.basename(file)}\``,
    description: 'A database or data schema file was modified.',
    actionItems: [
      'Document all new, removed, or renamed fields in the schema reference',
      'Write step-by-step migration instructions for existing data',
      'Update entity/model documentation to reflect the new shape',
      'Add to CHANGELOG with migration instructions link',
    ],
  },
  'new-feature': {
    titleFn: (_file, s) => `Write feature documentation for: ${s.commitMessage}`,
    description: 'A significant new feature was added.',
    actionItems: [
      'Add a feature overview section to the relevant docs page',
      'Include a real-world usage example',
      'Update README if this feature affects the main user workflow',
      'Add to CHANGELOG under Features',
    ],
  },
  'general': {
    titleFn: (file) => `Review documentation impact of changes to \`${path.basename(file)}\``,
    description: 'This change may have documentation implications.',
    actionItems: [
      'Review whether any existing docs reference this area and need updating',
      'Add to CHANGELOG if the change is user-visible',
    ],
  },
};

// ── Doc file suggestion ───────────────────────────────────────────────────────

const CANDIDATE_DOC_FILES = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'docs/api/index.md',
  'docs/api',
  'docs/guides',
  'docs',
];

export function suggestDocFiles(repoPath: string): string[] {
  const resolved = path.resolve(repoPath);
  return CANDIDATE_DOC_FILES.filter((f) => fs.existsSync(path.join(resolved, f)));
}

// ── LLM prompt for task description ──────────────────────────────────────────

function buildDocTaskPrompt(signal: DocSignal): string {
  const diffSection = signal.diffHunk
    ? `\nRelevant diff:\n\`\`\`\n${signal.diffHunk}\n\`\`\``
    : '';

  return `You are a technical documentation advisor. A code change was detected that likely needs documentation.

Commit: "${signal.commitMessage}"
File changed: ${signal.triggerFile}
Detection reason: ${signal.triggerPattern}
Change category: ${signal.category}
${diffSection}

Generate a documentation task in this exact JSON format:
{
  "title": "<specific 1-sentence title, max 100 chars, starts with an action verb>",
  "description": "<1-2 sentences explaining what needs to be documented and why>",
  "actionItems": ["<specific action 1, max 100 chars>", "<specific action 2>", "<specific action 3>"]
}

Rules:
- Title must be specific to this file and change — no generic phrases like "update documentation"
- Each action item must name a specific file, section, or example to add/update
- Do NOT invent information not present in the commit message or diff
- Return ONLY the JSON object, no other text`;
}

async function generateWithLLM(
  signal: DocSignal,
  provider: GeminiProvider,
): Promise<{ title: string; description: string; actionItems: string[] } | null> {
  try {
    const prompt = buildDocTaskPrompt(signal);
    // Use the provider's underlying model directly via a raw prompt
    const raw = await provider.rawPrompt(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      description?: string;
      actionItems?: string[];
    };
    if (!parsed.title || !parsed.actionItems?.length) return null;
    return {
      title: parsed.title,
      description: parsed.description ?? '',
      actionItems: parsed.actionItems,
    };
  } catch {
    return null;
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateDocTasks(
  signals: DocSignal[],
  repoPath: string,
  useLLM: boolean,
  provider?: GeminiProvider,
): Promise<DocTask[]> {
  const docFiles = suggestDocFiles(repoPath);
  const tasks: DocTask[] = [];

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const template = TEMPLATES[signal.category];

    let title = template.titleFn(signal.triggerFile, signal);
    let description = template.description;
    let actionItems = [...template.actionItems];

    if (useLLM && provider) {
      const llmResult = await generateWithLLM(signal, provider);
      if (llmResult) {
        title = llmResult.title;
        description = llmResult.description;
        actionItems = llmResult.actionItems;
      }
    }

    tasks.push({
      id: `doc-${signal.commitSha.slice(0, 7)}-${i}`,
      title,
      severity: signal.severity,
      category: signal.category,
      commitSha: signal.commitSha,
      commitMessage: signal.commitMessage,
      triggerFile: signal.triggerFile,
      description,
      actionItems,
      suggestedDocFiles: docFiles,
      status: 'pending',
    });
  }

  return tasks;
}
