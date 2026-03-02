import * as fs from 'fs';
import * as path from 'path';
import { Brief, BriefItem, TokenSpend } from './types';
import { parseMemoryFiles } from './parsers/memory-parser';
import { parseGitHistory } from './parsers/git-parser';
import { parseFileChanges } from './parsers/file-change-parser';

const DEFAULT_WORKSPACE = process.env.WORKSPACE_DIR || '/home/openclaw/.openclaw/workspace';
const DEFAULT_LOOKBACK = parseInt(process.env.LOOKBACK_HOURS || '8', 10);

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'complete': return '✅';
    case 'partial': return '⚠️';
    case 'failed': return '❌';
    default: return 'ℹ️';
  }
}

interface SessionParseResult {
  sessionCount: number;
  estimatedCost: string;
  details: string;
  notes: BriefItem[];
}

function parseOpenClawSessions(workspaceDir: string, lookbackHours: number): SessionParseResult {
  const sessionDir = path.join(path.dirname(workspaceDir), 'sessions');
  const cutoffMs = Date.now() - lookbackHours * 60 * 60 * 1000;

  let sessionCount = 0;
  const notes: BriefItem[] = [];

  try {
    if (!fs.existsSync(sessionDir)) {
      return {
        sessionCount: 0,
        estimatedCost: 'N/A',
        details: 'No OpenClaw sessions directory found',
        notes: [],
      };
    }

    const files = fs.readdirSync(sessionDir)
      .map((name) => path.join(sessionDir, name))
      .filter((fullPath) => {
        try {
          const stat = fs.statSync(fullPath);
          return stat.isFile() && stat.mtimeMs >= cutoffMs;
        } catch {
          return false;
        }
      });

    sessionCount = files.length;

    for (const filePath of files.slice(0, 30)) {
      const base = path.basename(filePath);
      if (base.includes('error') || base.includes('fail')) {
        notes.push({ text: `Session log indicates errors: ${base}`, status: 'partial' });
      }
    }
  } catch {
    return {
      sessionCount: 0,
      estimatedCost: 'N/A',
      details: 'Could not access session data',
      notes: [],
    };
  }

  return {
    sessionCount,
    estimatedCost: sessionCount > 0 ? `~$${(sessionCount * 0.15).toFixed(2)} (rough estimate)` : 'N/A',
    details: 'Parsed OpenClaw session metadata from local logs (no external API calls)',
    notes,
  };
}

export function generateBrief(
  workspaceDir: string = DEFAULT_WORKSPACE,
  lookbackHours: number = DEFAULT_LOOKBACK,
  outputDir?: string
): Brief {
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);

  // Parse all sources
  const memoryDir = path.join(workspaceDir, 'memory');
  const memoryResult = parseMemoryFiles(lookbackHours, memoryDir);
  const gitResult = parseGitHistory(lookbackHours, workspaceDir);
  const fileResult = parseFileChanges(lookbackHours, workspaceDir);
  const sessionResult = parseOpenClawSessions(workspaceDir, lookbackHours);

  const tokenSpend: TokenSpend = {
    sessionCount: sessionResult.sessionCount,
    estimatedCost: sessionResult.estimatedCost,
    details: sessionResult.details,
  };

  // Assemble what got done
  const whatGotDone: BriefItem[] = [...memoryResult.whatGotDone];
  if (gitResult.commits.length > 0) {
    for (const commit of gitResult.commits) {
      whatGotDone.push({
        text: `Git: ${commit.message} (${commit.hash})`,
        status: 'complete',
      });
    }
  }

  // If nothing found, add a note
  if (whatGotDone.length === 0) {
    whatGotDone.push({
      text: 'No completed tasks found in overnight logs',
      status: 'info',
    });
  }

  // Needs attention
  const needsAttention: BriefItem[] = [...memoryResult.needsAttention, ...sessionResult.notes];
  if (gitResult.error) {
    needsAttention.push({
      text: `Git: ${gitResult.error}`,
      status: 'partial',
    });
  }
  if (fileResult.error) {
    needsAttention.push({
      text: `File scan: ${fileResult.error}`,
      status: 'partial',
    });
  }

  // Suggested first action
  let suggestedFirstAction = memoryResult.suggestedAction;
  if (!suggestedFirstAction) {
    if (needsAttention.length > 0) {
      suggestedFirstAction = `Review ${needsAttention.length} attention item(s) flagged above`;
    } else if (whatGotDone.length > 0 && whatGotDone[0].status !== 'info') {
      suggestedFirstAction = 'Review overnight work and test changes';
    } else {
      suggestedFirstAction = 'Check workspace — no significant overnight activity detected';
    }
  }

  // Build markdown
  const markdown = buildMarkdown({
    date: dateStr,
    time: timeStr,
    whatGotDone,
    filesChanged: fileResult,
    gitCommits: gitResult.commits,
    gitDiffStat: gitResult.diffStat,
    tokenSpend,
    agentNotes: memoryResult.agentNotes,
    needsAttention,
    suggestedFirstAction,
  });

  const brief: Brief = {
    date: dateStr,
    generatedAt: now.toISOString(),
    whatGotDone,
    filesChanged: {
      modified: fileResult.totalModified,
      added: fileResult.totalAdded,
      deleted: fileResult.totalDeleted,
      files: fileResult.files.slice(0, 50), // Cap at 50 files
    },
    tokenSpend,
    agentNotes: memoryResult.agentNotes,
    needsAttention,
    suggestedFirstAction,
    gitCommits: gitResult.commits,
    raw: markdown,
  };

  // Write brief to file
  if (outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `morning-brief-${dateStr}.md`);
    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  return brief;
}

interface MarkdownInput {
  date: string;
  time: string;
  whatGotDone: BriefItem[];
  filesChanged: { files: { relativePath: string }[]; totalModified: number; totalAdded: number; totalDeleted: number };
  gitCommits: { hash: string; message: string }[];
  gitDiffStat: string;
  tokenSpend: TokenSpend;
  agentNotes: { section: string; content: string }[];
  needsAttention: BriefItem[];
  suggestedFirstAction: string;
}

function buildMarkdown(input: MarkdownInput): string {
  const lines: string[] = [];

  lines.push(`🌅 Morning Brief — ${input.date}`);
  lines.push(`Generated: ${input.time}`);
  lines.push('');

  // What Got Done
  lines.push('## What Got Done');
  for (const item of input.whatGotDone) {
    lines.push(`- ${statusEmoji(item.status || 'info')} ${item.text}`);
  }
  lines.push('');

  // Files Changed
  lines.push('## Files Changed');
  const total = input.filesChanged.totalModified + input.filesChanged.totalAdded + input.filesChanged.totalDeleted;
  lines.push(`- **${input.filesChanged.totalModified}** modified | **${input.filesChanged.totalAdded}** added | **${input.filesChanged.totalDeleted}** deleted | **${total}** total`);
  if (input.filesChanged.files.length > 0) {
    lines.push('');
    const displayFiles = input.filesChanged.files.slice(0, 20);
    for (const f of displayFiles) {
      lines.push(`  - \`${f.relativePath}\``);
    }
    if (input.filesChanged.files.length > 20) {
      lines.push(`  - ... and ${input.filesChanged.files.length - 20} more`);
    }
  }
  lines.push('');

  // Git Commits
  if (input.gitCommits.length > 0) {
    lines.push('## Git Activity');
    for (const commit of input.gitCommits) {
      lines.push(`- \`${commit.hash}\` ${commit.message}`);
    }
    lines.push('');
  }

  // Git Diff
  lines.push('## Git Diff (stat)');
  if (input.gitDiffStat.trim()) {
    const diffLines = input.gitDiffStat.split('\n').slice(0, 25);
    for (const line of diffLines) {
      lines.push(`- \`${line}\``);
    }
  } else {
    lines.push('- No git diff stats found in lookback window');
  }
  lines.push('');

  // Token Spend
  lines.push('## Token Spend (est.)');
  lines.push(`- Session count: ${input.tokenSpend.sessionCount}`);
  lines.push(`- Est. cost: ${input.tokenSpend.estimatedCost}`);
  if (input.tokenSpend.details) {
    lines.push(`- ${input.tokenSpend.details}`);
  }
  lines.push('');

  // Agent Notes
  lines.push('## Agent Notes');
  if (input.agentNotes.length === 0) {
    lines.push('- No agent notes found in overnight logs');
  } else {
    const displayNotes = input.agentNotes.slice(0, 10);
    for (const note of displayNotes) {
      lines.push(`### ${note.section}`);
      const truncated = note.content.length > 500
        ? note.content.substring(0, 500) + '...'
        : note.content;
      lines.push(truncated);
      lines.push('');
    }
  }
  lines.push('');

  // Needs Your Attention
  lines.push('## Needs Your Attention');
  if (input.needsAttention.length === 0) {
    lines.push('- ✅ Nothing urgent — all clear!');
  } else {
    for (const item of input.needsAttention) {
      lines.push(`- ${statusEmoji(item.status || 'partial')} ${item.text}`);
    }
  }
  lines.push('');

  // Suggested First Action
  lines.push('## Suggested First Action');
  lines.push(input.suggestedFirstAction);
  lines.push('');

  return lines.join('\n');
}
