import { loadConfig } from '../../config/loader';
import { GeminiProvider } from '../../llm/gemini';
import { LinearIntegrationClient } from '../../integrations/linear/client';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function pass(label: string, detail: string): void {
  console.log(`  ${GREEN}✓${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

function fail(label: string, detail: string): void {
  console.log(`  ${RED}✗${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

function skip(label: string, detail: string): void {
  console.log(`  ${DIM}-${RESET} ${label.padEnd(20)} ${DIM}${detail}${RESET}`);
}

export async function doctorCommand(): Promise<void> {
  const config = loadConfig();
  let allRequired = true;

  console.log(`\n${BOLD}Checking configuration...${RESET}`);

  const geminiKey = config.llm.apiKey;
  if (geminiKey) {
    pass('GEMINI_API_KEY', 'set');
  } else {
    fail('GEMINI_API_KEY', 'not set — run: daily-summary config init');
    allRequired = false;
  }

  const geminiModel = config.llm.model;
  if (geminiModel) {
    pass('GEMINI_MODEL', geminiModel);
  } else {
    fail('GEMINI_MODEL', 'not set — run: daily-summary config init');
    allRequired = false;
  }

  const linearKey = config.integrations?.linear?.apiKey;
  if (linearKey) {
    pass('LINEAR_API_KEY', 'set');
  } else {
    skip('LINEAR_API_KEY', 'not set (optional — needed for --with-linear)');
  }

  const teamId = config.integrations?.linear?.teamId;
  if (teamId) {
    pass('linear.teamId', teamId);
  } else {
    skip('linear.teamId', 'not set (optional — needed for --create-issues)');
  }

  console.log(`\n${BOLD}Checking Mintlify...${RESET}`);
  const mintlifyKey = config.integrations?.mintlify?.apiKey;
  const mintlifyProjectId = config.integrations?.mintlify?.projectId;
  if (mintlifyKey) {
    pass('MINTLIFY_API_KEY', 'set');
  } else {
    skip('MINTLIFY_API_KEY', 'not set (optional — needed for mintlify trigger)');
  }
  if (mintlifyProjectId) {
    pass('mintlify.projectId', mintlifyProjectId);
  } else {
    skip('mintlify.projectId', 'not set (optional — needed for mintlify trigger)');
  }

  console.log(`\n${BOLD}Testing Gemini connection...${RESET}`);
  if (geminiKey && geminiModel) {
    try {
      const provider = new GeminiProvider(geminiKey, geminiModel);
      const response = await provider.rawPrompt('Reply with just the word OK');
      if (response.trim()) {
        pass('Gemini API', `reachable (${geminiModel})`);
      } else {
        fail('Gemini API', 'empty response');
        allRequired = false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      fail('Gemini API', message);
      allRequired = false;
    }
  } else {
    skip('Gemini API', 'skipped (missing key or model)');
  }

  console.log(`\n${BOLD}Testing Linear connection...${RESET}`);
  if (linearKey) {
    try {
      const client = new LinearIntegrationClient(linearKey);
      const teams = await client.listTeams();
      if (teams.length > 0) {
        pass('Linear API', `reachable — ${teams.length} team(s): ${teams.map((t) => t.key).join(', ')}`);
        if (!teamId) {
          console.log(`\n  ${DIM}Tip: save your team ID with:${RESET}`);
          for (const t of teams) {
            console.log(`    ${DIM}daily-summary config set integrations.linear.teamId ${t.id}  # ${t.name}${RESET}`);
          }
        }
      } else {
        pass('Linear API', 'reachable (no teams found)');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      fail('Linear API', message);
    }
  } else {
    skip('Linear API', 'skipped (no key)');
  }

  console.log();
  if (allRequired) {
    console.log(`${GREEN}${BOLD}Setup looks good.${RESET} Run: daily-summary run --since 24h --no-edit`);
  } else {
    console.log(`${RED}${BOLD}Setup incomplete.${RESET} Run: daily-summary config init`);
    process.exit(1);
  }
  console.log();
}
