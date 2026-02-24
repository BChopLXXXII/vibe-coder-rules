/**
 * GuardRunner - Main orchestrator for scanning staged diffs
 */

const { execSync } = require('child_process');
const { SecretScanner } = require('./scanners/secret-scanner');
const { GhostFileScanner } = require('./scanners/ghost-file-scanner');
const { TodoScanner } = require('./scanners/todo-scanner');
const { ImportScanner } = require('./scanners/import-scanner');
const { ScanResults } = require('./scan-results');

class GuardRunner {
  constructor(options = {}) {
    this.options = options;
    this.scanners = [
      new SecretScanner(),
      new GhostFileScanner(),
      new TodoScanner(options.failOnTodo),
      new ImportScanner()
    ];
  }

  async scan() {
    // Check if we're in a git repo
    this._ensureGitRepo();

    // Get staged diff
    const diff = this._getStagedDiff();
    
    if (!diff || diff.trim().length === 0) {
      return new ScanResults({ empty: true });
    }

    // Parse diff into file chunks
    const fileChunks = this._parseDiff(diff);
    
    // Run all scanners
    const results = new ScanResults();
    
    for (const scanner of this.scanners) {
      const findings = await scanner.scan(fileChunks);
      results.addFindings(scanner.name, findings);
    }

    return results;
  }

  _ensureGitRepo() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not a git repository. Run from within a git project.');
    }
  }

  _getStagedDiff() {
    try {
      return execSync('git diff --staged --no-color', { 
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024 // 50MB max
      });
    } catch (error) {
      if (error.status === 128) {
        throw new Error('Git error: Unable to get staged diff');
      }
      return '';
    }
  }

  _parseDiff(diff) {
    const chunks = [];
    const lines = diff.split('\n');
    
    let currentChunk = null;
    let currentHunk = null;
    
    for (const line of lines) {
      // New file diff starts
      if (line.startsWith('diff --git')) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        currentChunk = {
          oldFile: match ? match[1] : null,
          newFile: match ? match[2] : null,
          hunks: [],
          addedLines: [],
          removedLines: [],
          isNewFile: false,
          isDeleted: false
        };
        currentHunk = null;
        continue;
      }

      // File mode info
      if (line.startsWith('new file mode')) {
        if (currentChunk) currentChunk.isNewFile = true;
        continue;
      }
      if (line.startsWith('deleted file mode')) {
        if (currentChunk) currentChunk.isDeleted = true;
        continue;
      }

      // Hunk header
      if (line.startsWith('@@')) {
        if (currentChunk && currentHunk) {
          currentChunk.hunks.push(currentHunk);
        }
        currentHunk = {
          header: line,
          lines: []
        };
        continue;
      }

      // Added/removed/context lines
      if (currentHunk) {
        currentHunk.lines.push(line);
        
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = line.slice(1);
          currentChunk.addedLines.push({
            content,
            hunkHeader: currentHunk.header
          });
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentChunk.removedLines.push({
            content: line.slice(1),
            hunkHeader: currentHunk.header
          });
        }
      }
    }

    // Push final chunk
    if (currentChunk) {
      if (currentHunk) {
        currentChunk.hunks.push(currentHunk);
      }
      chunks.push(currentChunk);
    }

    return chunks;
  }
}

module.exports = { GuardRunner };
