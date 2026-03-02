import { execSync } from 'child_process';
import * as path from 'path';
import { FileChange } from '../types';

const DEFAULT_WORKSPACE = process.env.WORKSPACE_DIR || '/home/openclaw/.openclaw/workspace';

// Directories to skip when scanning
const SKIP_DIRS = [
  'node_modules',
  '.next',
  '.git',
  '.openclaw',
  'dist',
  'build',
  '.cache',
  '.turbo',
];

interface FileChangeResult {
  files: FileChange[];
  totalModified: number;
  totalAdded: number;
  totalDeleted: number;
  error?: string;
}

export function parseFileChanges(
  lookbackHours: number = 8,
  workspaceDir: string = DEFAULT_WORKSPACE
): FileChangeResult {
  const result: FileChangeResult = {
    files: [],
    totalModified: 0,
    totalAdded: 0,
    totalDeleted: 0,
  };

  const skipArgs = SKIP_DIRS.map((d) => `-name "${d}" -prune`).join(' -o ');
  const lookbackMinutes = Math.floor(lookbackHours * 60);

  try {
    // Find files modified within the lookback window
    const cmd = `find "${workspaceDir}" \\( ${skipArgs} \\) -prune -o -type f -mmin -${lookbackMinutes} -print 2>/dev/null | head -200`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    }).trim();

    if (output) {
      const files = output.split('\n').filter((f) => f.length > 0);
      for (const filePath of files) {
        const relativePath = path.relative(workspaceDir, filePath);
        // Skip hidden files and build artifacts
        if (relativePath.startsWith('.') && !relativePath.startsWith('.openclaw')) {
          continue;
        }

        result.files.push({
          path: filePath,
          type: 'modified', // We can't easily distinguish add vs modify from `find`
          relativePath,
        });
        result.totalModified++;
      }
    }
  } catch (err) {
    result.error = `Failed to scan file changes: ${err instanceof Error ? err.message : 'unknown error'}`;
  }

  return result;
}
