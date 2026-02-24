/**
 * TodoScanner - Detects TODO/FIXME bombs left by AI agents
 * These are often indicators of incomplete work
 */

class TodoScanner {
  constructor(failOnTodo = false) {
    this.name = 'todo-fixme';
    this.failOnTodo = failOnTodo;
    
    // Patterns for TODO/FIXME comments and markers
    this.patterns = [
      {
        type: 'CRITICAL FIXME',
        pattern: /\/\/\s*FIXME[!:](?!\s*#\d+)/i,
        severity: 'ERROR'
      },
      {
        type: 'CRITICAL TODO',
        pattern: /\/\/\s*TODO[!:](?!\s*#\d+)/i,
        severity: 'ERROR'
      },
      {
        type: 'FIXME (multiline)',
        pattern: /\/\*[\s\S]*?FIXME[\s\S]*?\*\//i,
        severity: 'ERROR'
      },
      {
        type: 'TODO (multiline)',
        pattern: /\/\*[\s\S]*?TODO[\s\S]*?\*\//i,
        severity: 'ERROR'
      },
      {
        type: 'Python FIXME',
        pattern: /#\s*FIXME[!:](?!\s*#\d+)/i,
        severity: 'ERROR'
      },
      {
        type: 'Python TODO',
        pattern: /#\s*TODO[!:](?!\s*#\d+)/i,
        severity: 'ERROR'
      },
      // Regular TODOs (warnings unless --fail-on-todo)
      {
        type: 'TODO comment',
        pattern: /\bTODO\b/i,
        severity: failOnTodo ? 'ERROR' : 'WARN',
        filter: (line) => !line.includes('TODO:') || !line.match(/TODO:\s*#?\d+/)
      },
      {
        type: 'FIXME comment',
        pattern: /\bFIXME\b/i,
        severity: failOnTodo ? 'ERROR' : 'WARN',
        filter: (line) => !line.includes('FIXME:') || !line.match(/FIXME:\s*#?\d+/)
      },
      // AI-specific markers
      {
        type: 'AI Stub Marker',
        pattern: /\b(STUB|PLACEHOLDER|XXX|HACK|TEMP|TEMPORARY)\b/i,
        severity: failOnTodo ? 'ERROR' : 'WARN'
      },
      {
        type: 'Incomplete Implementation',
        pattern: /(implement|complete|finish)\s+this\s+(later|soon|todo)/i,
        severity: 'WARN'
      },
      {
        type: 'AI Generated Comment',
        pattern: /\bAI\s+(generated|wrote|created)\b|\b(generated|created)\s+by\s+AI\b/i,
        severity: 'WARN'
      }
    ];
  }

  async scan(fileChunks) {
    const findings = [];
    const seen = new Set(); // Deduplication

    for (const chunk of fileChunks) {
      for (const { content, hunkHeader } of chunk.addedLines) {
        for (const rule of this.patterns) {
          if (rule.pattern.test(content)) {
            // Apply filter if present
            if (rule.filter && !rule.filter(content)) {
              continue;
            }

            // Deduplicate by line content
            const key = `${chunk.newFile}:${content.trim()}`;
            if (seen.has(key)) continue;
            seen.add(key);

            findings.push({
              severity: rule.severity,
              type: rule.type,
              file: chunk.newFile,
              line: this._extractLineNumber(hunkHeader),
              snippet: content.trim()
            });
          }
        }
      }
    }

    return findings;
  }

  _extractLineNumber(hunkHeader) {
    if (!hunkHeader) return '?';
    const match = hunkHeader.match(/\+\d+/);
    return match ? match[0].slice(1) : '?';
  }
}

module.exports = { TodoScanner };
