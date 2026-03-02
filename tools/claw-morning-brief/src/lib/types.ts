export interface BriefSection {
  title: string;
  items: BriefItem[];
}

export interface BriefItem {
  text: string;
  status?: 'complete' | 'partial' | 'failed' | 'info';
}

export interface FileChange {
  path: string;
  type: 'modified' | 'added' | 'deleted';
  relativePath: string;
}

export interface GitCommit {
  hash: string;
  message: string;
}

export interface AgentNote {
  section: string;
  content: string;
  timestamp?: string;
}

export interface TokenSpend {
  sessionCount: number;
  estimatedCost: string;
  details?: string;
}

export interface Brief {
  date: string;
  generatedAt: string;
  whatGotDone: BriefItem[];
  filesChanged: {
    modified: number;
    added: number;
    deleted: number;
    files: FileChange[];
  };
  tokenSpend: TokenSpend;
  agentNotes: AgentNote[];
  needsAttention: BriefItem[];
  suggestedFirstAction: string;
  gitCommits: GitCommit[];
  raw: string; // the full markdown
}

export interface BriefListItem {
  date: string;
  filename: string;
  summary: string;
  hasAttentionItems: boolean;
  itemCount: number;
}
