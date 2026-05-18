import { NormalizedCommit } from '../git/normalizer';

export interface IssueRef {
  raw: string;
  identifier: string;
  type: 'linear' | 'github' | 'unknown';
  closingKeyword?: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: number;
  url: string;
  labels: string[];
  cycleNumber?: number;
  cycleTitle?: string;
}

export interface EnrichedCommit extends NormalizedCommit {
  issueRefs: IssueRef[];
  linearIssues: LinearIssue[];
}

export interface TicketGroup {
  identifier: string;
  title: string;
  url?: string;
  status?: string;
  priority?: number;
  cycleNumber?: number;
  cycleTitle?: string;
  commits: EnrichedCommit[];
}
