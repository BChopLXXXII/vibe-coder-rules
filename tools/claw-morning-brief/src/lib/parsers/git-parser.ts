import { execSync } from 'child_process';
import { GitCommit, FileChange } from '../types';

const DEFAULT_WORKSPACE = process.env.WORKSPACE_DIR || '/home/openclaw/.openclaw/workspace';

interface GitParseResult {
  commits: GitCommit[];
  filesChanged: FileChange[];
  diffStat: string;
  error?: string;
}

export function parseGitHistory(
  lookbackHours: number = 8,
  workspaceDir: string = DEFAULT_WORKSPACE
): GitParseResult {
  const result: GitParseResult = {
    commits: [],
    filesChanged: [],
    diffStat: '',
  };

  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: workspaceDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    result.error = 'Not a git repository';
    return result;
  }

  // Get recent commits
  try {
    const logOutput = execSync(
      `git log --oneline --since="${lookbackHours} hours ago" --no-merges`,
      {
        cwd: workspaceDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    ).trim();

    if (logOutput) {
      result.commits = logOutput.split('\n').map((line) => {
        const spaceIdx = line.indexOf(' ');
        return {
          hash: line.substring(0, spaceIdx),
          message: line.substring(spaceIdx + 1),
        };
      });
    }
  } catch {
    // no commits in lookback window
  }

  // Parse changed files and line stats over lookback window from git log --numstat
  try {
    const numstat = execSync(
      `git log --since="${lookbackHours} hours ago" --pretty=tformat: --numstat`,
      {
        cwd: workspaceDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    ).trim();

    if (numstat) {
      let totalAdded = 0;
      let totalDeleted = 0;
      const files = new Set<string>();

      for (const line of numstat.split('\n')) {
        const parts = line.trim().split('\t');
        if (parts.length < 3) continue;

        const added = parseInt(parts[0], 10);
        const deleted = parseInt(parts[1], 10);
        const filePath = parts[2];

        if (!Number.isNaN(added)) totalAdded += added;
        if (!Number.isNaN(deleted)) totalDeleted += deleted;
        files.add(filePath);
      }

      result.filesChanged = Array.from(files).map((filePath) => ({
        path: filePath,
        type: 'modified',
        relativePath: filePath,
      }));

      result.diffStat = `${result.filesChanged.length} file(s) changed, ${totalAdded} insertion(s)(+), ${totalDeleted} deletion(s)(-)`;
    }
  } catch {
    // no diff data
  }

  return result;
}
