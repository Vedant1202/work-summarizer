import { LinearClient } from '@linear/sdk';
import { LinearIssue } from '../types';

function parseIdentifier(identifier: string): { teamKey: string; number: number } | null {
  const match = identifier.match(/^([A-Z]{2,10})-(\d+)$/);
  if (!match) return null;
  return { teamKey: match[1], number: parseInt(match[2], 10) };
}

export class LinearIntegrationClient {
  private client: LinearClient;

  constructor(apiKey: string) {
    this.client = new LinearClient({ apiKey });
  }

  async fetchIssues(identifiers: string[]): Promise<Map<string, LinearIssue>> {
    if (identifiers.length === 0) return new Map();

    // Group by team key so we can batch per team
    const byTeam = new Map<string, number[]>();
    for (const id of identifiers) {
      const parsed = parseIdentifier(id);
      if (!parsed) continue;
      const existing = byTeam.get(parsed.teamKey) ?? [];
      existing.push(parsed.number);
      byTeam.set(parsed.teamKey, existing);
    }

    const result = new Map<string, LinearIssue>();

    for (const [teamKey, numbers] of byTeam) {
      try {
        const issues = await this.client.issues({
          filter: {
            team: { key: { eq: teamKey } },
            number: { in: numbers },
          },
          includeArchived: false,
        });

        for (const issue of issues.nodes) {
          const state = await issue.state;
          const labels = await issue.labels();
          let cycleNumber: number | undefined;
          let cycleTitle: string | undefined;

          try {
            const cycle = await issue.cycle;
            if (cycle) {
              cycleNumber = cycle.number;
              cycleTitle = cycle.name ?? undefined;
            }
          } catch {
            // cycle may not be available for all issues
          }

          const linearIssue: LinearIssue = {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            status: state?.name ?? 'Unknown',
            priority: issue.priority,
            url: issue.url,
            labels: labels.nodes.map((l) => l.name),
            cycleNumber,
            cycleTitle,
          };
          result.set(issue.identifier, linearIssue);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Linear API error fetching issues for team ${teamKey}: ${message}`);
      }
    }

    return result;
  }

  async createIssue(params: {
    title: string;
    description: string;
    teamId: string;
    priority?: number;
  }): Promise<{ identifier: string; url: string }> {
    try {
      const payload = await this.client.createIssue({
        title: params.title,
        description: params.description,
        teamId: params.teamId,
        priority: params.priority,
      });

      const issue = await payload.issue;
      if (!issue) {
        throw new Error('Issue creation returned no issue object');
      }

      return { identifier: issue.identifier, url: issue.url };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Linear API error creating issue: ${message}`);
    }
  }

  async listTeams(): Promise<Array<{ id: string; name: string; key: string }>> {
    try {
      const teams = await this.client.teams();
      return teams.nodes.map((t) => ({ id: t.id, name: t.name, key: t.key }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Linear API error listing teams: ${message}`);
    }
  }
}
