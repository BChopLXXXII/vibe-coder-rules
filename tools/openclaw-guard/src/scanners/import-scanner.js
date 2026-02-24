/**
 * ImportScanner - Detects invented/unresolved imports and symbol stubs
 * Catches imports from non-existent modules and stubbed symbols
 */

class ImportScanner {
  constructor() {
    this.name = 'unresolved-imports';
    
    // Known built-in modules per language
    this.builtins = {
      node: new Set([
        'fs', 'path', 'http', 'https', 'url', 'querystring', 'stream', 
        'util', 'crypto', 'os', 'net', 'dgram', 'dns', 'tls', 'zlib',
        'events', 'assert', 'buffer', 'child_process', 'cluster', 'console',
        'constants', 'domain', 'module', 'process', 'punycode', 'readline',
        'repl', 'string_decoder', 'sys', 'timers', 'tty', 'v8', 'vm'
      ]),
      python: new Set([
        'os', 'sys', 'json', 're', 'math', 'random', 'datetime', 'collections',
        'itertools', 'functools', 'typing', 'pathlib', 'subprocess', 'time',
        'hashlib', 'base64', 'urllib', 'http', 'unittest', 'pdb', 'inspect',
        'importlib', 'pkgutil', 'logging', 'warnings', 'contextlib', 'enum'
      ])
    };
    
    this.patterns = [
      // JS: import { missing } from 'existent-module'
      {
        lang: 'js',
        type: 'ES6 Import',
        pattern: /import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/,
        extract: (match) => ({
          symbols: match[1].split(',').map(s => s.trim().split(' as ')[0].trim()),
          source: match[2]
        })
      },
      // JS: import * as name from 'module'
      {
        lang: 'js',
        type: 'ES6 Namespace Import',
        pattern: /import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["']/,
        extract: (match) => ({
          symbols: [match[1]],
          source: match[2],
          isNamespace: true
        })
      },
      // JS: import name from 'module'
      {
        lang: 'js',
        type: 'ES6 Default Import',
        pattern: /import\s+(\w+)\s+from\s+["']([^"']+)["']/,
        extract: (match) => ({
          symbols: [match[1]],
          source: match[2]
        })
      },
      // JS: require('module')
      {
        lang: 'js',
        type: 'CommonJS Require',
        pattern: /(?:const|let|var)\s+(?:\{?\s*([^}]+)\}?|\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/,
        extract: (match) => ({
          symbols: match[1] ? match[1].split(',').map(s => s.trim().split(':')[0].trim()) : [match[0].match(/(?:const|let|var)\s+(\w+)/)?.[1] || 'unknown'],
          source: match[2]
        })
      },
      // Python: from module import symbol
      {
        lang: 'py',
        type: 'Python Import',
        pattern: /from\s+([\w.]+)\s+import\s+(.+)/,
        extract: (match) => ({
          symbols: match[2].split(',').map(s => s.trim()),
          source: match[1]
        })
      },
      // Detect stub functions (common AI pattern)
      {
        lang: 'any',
        type: 'Stub Function',
        pattern: /^(?:export\s+)?(?:function|const|let|var)?\s*(\w+)\s*[=(].*\{[^}]*\bpass\b[^}]*\}|\bthrow\s+new\s+Error\s*\(\s*["']Not implemented["']\s*\)|\breturn\s+null\s*\/\/\s*TODO|\breturn\s+undefined\s*\/\/\s*TODO/,
        extract: (match, content) => ({
          symbol: match[1] || 'unknown',
          stubType: content.includes('pass') ? 'pass' : 
                    content.includes('Not implemented') ? 'not-implemented' : 'todo-return'
        })
      }
    ];
  }

  async scan(fileChunks) {
    const findings = [];
    const seen = new Set();

    for (const chunk of fileChunks) {
      // Determine file type
      const isJs = chunk.newFile.match(/\.(js|ts|jsx|tsx|mjs|cjs)$/);
      const isPy = chunk.newFile.match(/\.py$/);

      for (const { content, hunkHeader } of chunk.addedLines) {
        // Check for stub patterns
        if (this._isStubFunction(content)) {
          const key = `${chunk.newFile}:stub:${content}`;
          if (!seen.has(key)) {
            seen.add(key);
            findings.push({
              severity: 'WARN',
              type: 'Stub Function',
              file: chunk.newFile,
              line: this._extractLineNumber(hunkHeader),
              snippet: content.trim(),
              note: 'Function appears to be an incomplete stub'
            });
          }
        }

        // Check imports
        for (const rule of this.patterns) {
          if (rule.lang === 'any') continue;
          if (rule.lang === 'js' && !isJs) continue;
          if (rule.lang === 'py' && !isPy) continue;

          const match = content.match(rule.pattern);
          if (match && rule.extract) {
            const extracted = rule.extract(match);
            
            // Skip relative imports (handled by GhostFileScanner)
            if (extracted.source.startsWith('.')) continue;
            
            // Skip known built-ins
            if (this._isBuiltIn(extracted.source, rule.lang)) continue;
            
            // Skip npm packages (we can't verify without node_modules)
            if (rule.lang === 'js' && !extracted.source.startsWith('.')) {
              // Flag it as unverified external import
              const key = `${chunk.newFile}:${extracted.source}`;
              if (!seen.has(key)) {
                seen.add(key);
                findings.push({
                  severity: 'WARN',
                  type: 'External Import',
                  file: chunk.newFile,
                  line: this._extractLineNumber(hunkHeader),
                  snippet: content.trim(),
                  source: extracted.source,
                  note: 'External dependency - ensure it is in package.json/requirements.txt'
                });
              }
            }
          }
        }

        // Detect unresolved symbol usage (simple heuristic)
        const unresolvedMatch = content.match(/\b(notImplemented|placeholder|stub)\s*\(/i);
        if (unresolvedMatch) {
          const key = `${chunk.newFile}:symbol:${content}`;
          if (!seen.has(key)) {
            seen.add(key);
            findings.push({
              severity: 'WARN',
              type: 'Unresolved Symbol',
              file: chunk.newFile,
              line: this._extractLineNumber(hunkHeader),
              snippet: content.trim(),
              symbol: unresolvedMatch[0]
            });
          }
        }
      }
    }

    return findings;
  }

  _isStubFunction(content) {
    const stubPatterns = [
      /\{\s*\/\/\s*TODO[\s\S]*?\}/i,
      /\{\s*return\s+(null|undefined)\s*;?\s*\/\/\s*(TODO|FIXME|stub)/i,
      /\{\s*pass\s*\}/,
      /throw\s+new\s+(?:Error|NotImplementedError)\s*\(\s*["'][^"']*(?:not implemented|TODO|stub)["']/i,
      /function\s+\w+\s*\(\)\s*\{\s*\}/,
      /=>\s*\{\s*return\s+(null|undefined);?\s*\}\s*\/\/\s*(TODO|stub)/i
    ];
    
    return stubPatterns.some(p => p.test(content));
  }

  _isBuiltIn(moduleName, lang) {
    if (lang === 'js' && this.builtins.node.has(moduleName)) return true;
    if (lang === 'py' && this.builtins.python.has(moduleName)) return true;
    return false;
  }

  _extractLineNumber(hunkHeader) {
    if (!hunkHeader) return '?';
    const match = hunkHeader.match(/\+\d+/);
    return match ? match[0].slice(1) : '?';
  }
}

module.exports = { ImportScanner };
