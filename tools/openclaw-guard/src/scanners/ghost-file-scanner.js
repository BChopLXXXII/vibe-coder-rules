/**
 * GhostFileScanner - Detects references to non-existent files
 * Catches hallucinated imports, requires, and file references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GhostFileScanner {
  constructor() {
    this.name = 'ghost-files';
    
    // Patterns that reference files
    this.patterns = [
      // JavaScript/TypeScript imports
      {
        lang: 'js',
        pattern: /import\s+.*?\s+from\s+["'](\.\.?\/[^"']+)["']/g,
        extensions: ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts']
      },
      {
        lang: 'js',
        pattern: /require\s*\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g,
        extensions: ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts']
      },
      {
        lang: 'js',
        pattern: /import\s*\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g,
        extensions: ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts']
      },
      
      // Python imports
      {
        lang: 'py',
        pattern: /from\s+(\.[\w.]+)\s+import/g,
        extensions: ['.py', '/__init__.py']
      },
      {
        lang: 'py',
        pattern: /import\s+(\.[\w.]+)/g,
        extensions: ['.py', '/__init__.py']
      },
      
      // CSS/SCSS imports
      {
        lang: 'css',
        pattern: /@import\s+["'](\.\.?\/[^"']+)["']/g,
        extensions: ['', '.css', '.scss', '.sass', '.less']
      },
      
      // Static file references (URL, fetch, etc)
      {
        lang: 'any',
        pattern: /["'](\.\.?\/[^"']+\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|eot|mp3|mp4|webm|pdf))["']/gi,
        extensions: ['']
      },
      
      // File system reads
      {
        lang: 'any',
        pattern: /fs\.(?:readFile|readFileSync|existsSync)\s*\(\s*["'](\.\.?\/[^"']+)["']/g,
        extensions: ['']
      }
    ];
    
    // Cache for file existence checks
    this.fileCache = new Map();
    this.repoRoot = this._findRepoRoot();
  }

  async scan(fileChunks) {
    const findings = [];
    
    for (const chunk of fileChunks) {
      const fileDir = path.dirname(chunk.newFile);
      
      for (const { content, hunkHeader } of chunk.addedLines) {
        for (const rule of this.patterns) {
          // Reset lastIndex for global regex
          rule.pattern.lastIndex = 0;
          
          let match;
          while ((match = rule.pattern.exec(content)) !== null) {
            const refPath = match[1];
            
            // Resolve the referenced file path
            const resolvedPaths = this._resolvePaths(refPath, fileDir, rule.extensions);
            
            // Check if any variation exists
            const exists = resolvedPaths.some(p => this._fileExists(p));
            
            if (!exists) {
              findings.push({
                severity: 'WARN',
                type: 'Ghost File Reference',
                file: chunk.newFile,
                line: this._extractLineNumber(hunkHeader),
                snippet: content.trim(),
                reference: refPath,
                attempted: resolvedPaths.slice(0, 3) // Show first few attempts
              });
            }
          }
        }
      }
    }
    
    return findings;
  }

  _findRepoRoot() {
    try {
      const root = execSync('git rev-parse --show-toplevel', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      }).trim();
      return root;
    } catch {
      return process.cwd();
    }
  }

  _resolvePaths(refPath, fromDir, extensions) {
    const resolved = [];
    
    // Handle Python relative imports
    if (refPath.startsWith('.')) {
      // Python: .module -> ./module.py
      // JS: ./module -> ./module.js
      const basePath = path.join(this.repoRoot, fromDir, refPath);
      
      for (const ext of extensions) {
        resolved.push(basePath + ext);
      }
    }
    
    return resolved;
  }

  _fileExists(filePath) {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath);
    }
    
    // Check in git index (staged files count as existing)
    const inGitIndex = this._isInGitIndex(filePath);
    if (inGitIndex) {
      this.fileCache.set(filePath, true);
      return true;
    }
    
    // Check filesystem
    const exists = fs.existsSync(filePath);
    this.fileCache.set(filePath, exists);
    return exists;
  }

  _isInGitIndex(filePath) {
    try {
      const relativePath = path.relative(this.repoRoot, filePath);
      execSync(`git ls-files --error-unmatch "${relativePath}"`, {
        cwd: this.repoRoot,
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }

  _extractLineNumber(hunkHeader) {
    if (!hunkHeader) return '?';
    const match = hunkHeader.match(/\+\d+/);
    return match ? match[0].slice(1) : '?';
  }
}

module.exports = { GhostFileScanner };
