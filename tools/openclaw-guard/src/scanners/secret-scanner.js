/**
 * SecretScanner - Detects potential secrets in staged changes
 * Checks for API keys, tokens, private keys, passwords, etc.
 */

class SecretScanner {
  constructor() {
    this.name = 'secrets';
    
    // Patterns for common secrets
    this.patterns = [
      // AWS Keys
      {
        name: 'AWS Access Key ID',
        pattern: /AKIA[0-9A-Z]{16}/,
        severity: 'ERROR'
      },
      {
        name: 'AWS Secret Access Key',
        pattern: /["']?aws[_-]?secret[_-]?access[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9/+=]{40}["']/i,
        severity: 'ERROR'
      },
      
      // Generic high-entropy secrets
      {
        name: 'Generic Secret/Token',
        pattern: /["']?(api[_-]?key|apikey|secret[_-]?key|secret|auth[_-]?token|access[_-]?token)["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/i,
        severity: 'ERROR'
      },
      
      // Private Keys
      {
        name: 'Private Key (PEM)',
        pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/,
        severity: 'ERROR'
      },
      
      // GitHub Tokens
      {
        name: 'GitHub Token',
        pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/,
        severity: 'ERROR'
      },
      
      // Slack Tokens
      {
        name: 'Slack Token',
        pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/,
        severity: 'ERROR'
      },
      
      // Stripe Keys
      {
        name: 'Stripe Live Key',
        pattern: /sk_live_[0-9a-zA-Z]{24,}/,
        severity: 'ERROR'
      },
      
      // Generic password patterns
      {
        name: 'Hardcoded Password',
        pattern: /["']?password["']?\s*[:=]\s*["'][^"']{8,}["']/i,
        severity: 'WARN',
        filter: (match) => !match.toLowerCase().includes('placeholder') && 
                          !match.toLowerCase().includes('example') &&
                          !match.toLowerCase().includes('changeme')
      },
      
      // Database connection strings with passwords
      {
        name: 'Database URL with Password',
        pattern: /(mongodb|mysql|postgres|postgresql):\/\/[^:]+:[^@]+@/i,
        severity: 'ERROR'
      },
      
      // JWT tokens
      {
        name: 'JWT Token',
        pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
        severity: 'WARN'
      },
      
      // OpenAI API Key
      {
        name: 'OpenAI API Key',
        pattern: /sk-[a-zA-Z0-9]{48}/,
        severity: 'ERROR'
      }
    ];
  }

  async scan(fileChunks) {
    const findings = [];

    for (const chunk of fileChunks) {
      // Only scan added/modified lines
      for (const { content, hunkHeader } of chunk.addedLines) {
        for (const rule of this.patterns) {
          // Ensure pattern is global for matchAll
          const pattern = rule.pattern.global 
            ? rule.pattern 
            : new RegExp(rule.pattern.source, rule.pattern.flags + 'g');
          
          const matches = content.matchAll(pattern);
          
          for (const match of matches) {
            // Apply filter if present
            if (rule.filter && !rule.filter(match[0])) {
              continue;
            }

            findings.push({
              severity: rule.severity,
              type: rule.name,
              file: chunk.newFile,
              line: this._extractLineNumber(hunkHeader),
              snippet: this._truncateSnippet(content.trim(), match[0]),
              match: this._maskSecret(match[0])
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

  _truncateSnippet(content, match, maxLength = 80) {
    const matchIndex = content.indexOf(match);
    if (matchIndex === -1) return content.slice(0, maxLength);
    
    let start = Math.max(0, matchIndex - 20);
    let end = Math.min(content.length, matchIndex + match.length + 20);
    
    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  _maskSecret(secret) {
    if (secret.length < 8) return secret;
    const visible = Math.min(4, Math.floor(secret.length / 4));
    return secret.slice(0, visible) + '***' + secret.slice(-visible);
  }
}

module.exports = { SecretScanner };
