/**
 * Formatters - Terminal output formatting for scan results
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function formatReport(results) {
  if (results.empty) {
    return `
${COLORS.gray}────────────────────────────────────────${COLORS.reset}
${COLORS.yellow}⚠ No staged changes to scan${COLORS.reset}
${COLORS.gray}────────────────────────────────────────${COLORS.reset}
`;
  }

  const summary = results.getSummary();
  let output = '\n';
  
  // Header
  output += `${COLORS.bright}╔══════════════════════════════════════════════════════════════╗${COLORS.reset}\n`;
  output += `${COLORS.bright}║${COLORS.reset}           ${COLORS.cyan}OPENCLAW GUARD${COLORS.reset} - AI-Code Risk Report           ${COLORS.bright}║${COLORS.reset}\n`;
  output += `${COLORS.bright}╚══════════════════════════════════════════════════════════════╝${COLORS.reset}\n\n`;

  // Summary box
  const statusColor = summary.errors > 0 ? COLORS.red : (summary.warnings > 0 ? COLORS.yellow : COLORS.green);
  const statusIcon = summary.errors > 0 ? '✗' : (summary.warnings > 0 ? '⚠' : '✓');
  const statusText = summary.errors > 0 ? 'BLOCKING ISSUES FOUND' : (summary.warnings > 0 ? 'WARNINGS FOUND' : 'CLEAN');
  
  output += `${COLORS.bright}┌────────────────────────────────────────────────────────────┐${COLORS.reset}\n`;
  output += `${COLORS.bright}│${COLORS.reset}  ${statusColor}${statusIcon} ${statusText}${COLORS.reset}${' '.repeat(45 - statusText.length)}${COLORS.bright}│${COLORS.reset}\n`;
  output += `${COLORS.bright}│${COLORS.reset}     ${COLORS.red}● Errors: ${summary.errors}${COLORS.reset}${' '.repeat(41 - String(summary.errors).length)}${COLORS.bright}│${COLORS.reset}\n`;
  output += `${COLORS.bright}│${COLORS.reset}     ${COLORS.yellow}● Warnings: ${summary.warnings}${COLORS.reset}${' '.repeat(39 - String(summary.warnings).length)}${COLORS.bright}│${COLORS.reset}\n`;
  output += `${COLORS.bright}│${COLORS.reset}     ${COLORS.gray}○ Total: ${summary.total}${COLORS.reset}${' '.repeat(43 - String(summary.total).length)}${COLORS.bright}│${COLORS.reset}\n`;
  output += `${COLORS.bright}└────────────────────────────────────────────────────────────┘${COLORS.reset}\n\n`;

  // Findings by category
  for (const [scannerName, findings] of Object.entries(results.findings)) {
    if (findings.length === 0) continue;

    const scannerDisplay = scannerName.toUpperCase().replace(/-/g, ' ');
    output += `${COLORS.bright}${COLORS.cyan}▶ ${scannerDisplay}${COLORS.reset}\n`;
    output += `${COLORS.gray}${'─'.repeat(60)}${COLORS.reset}\n`;

    for (const finding of findings) {
      const sevColor = finding.severity === 'ERROR' ? COLORS.red : COLORS.yellow;
      const sevLabel = finding.severity === 'ERROR' ? 'ERR' : 'WARN';
      
      output += `  ${sevColor}[${sevLabel}]${COLORS.reset} ${COLORS.bright}${finding.type}${COLORS.reset}\n`;
      output += `  ${COLORS.gray}File:${COLORS.reset} ${finding.file}:${finding.line}\n`;
      
      if (finding.snippet) {
        const truncated = finding.snippet.length > 65 
          ? finding.snippet.slice(0, 62) + '...' 
          : finding.snippet;
        output += `  ${COLORS.gray}Code:${COLORS.reset} ${COLORS.dim}${truncated}${COLORS.reset}\n`;
      }
      
      if (finding.match) {
        output += `  ${COLORS.gray}Match:${COLORS.reset} ${COLORS.magenta}${finding.match}${COLORS.reset}\n`;
      }
      
      if (finding.reference) {
        output += `  ${COLORS.gray}Ref:${COLORS.reset} ${finding.reference}\n`;
      }
      
      if (finding.note) {
        output += `  ${COLORS.gray}Note:${COLORS.reset} ${finding.note}\n`;
      }
      
      output += '\n';
    }
  }

  // Footer
  if (summary.errors > 0) {
    output += `${COLORS.red}┌────────────────────────────────────────────────────────────┐${COLORS.reset}\n`;
    output += `${COLORS.red}│${COLORS.reset}  ${COLORS.bright}Commit blocked:${COLORS.reset} Fix errors before committing         ${COLORS.red}│${COLORS.reset}\n`;
    output += `${COLORS.red}└────────────────────────────────────────────────────────────┘${COLORS.reset}\n`;
  } else if (summary.warnings > 0) {
    output += `${COLORS.yellow}┌────────────────────────────────────────────────────────────┐${COLORS.reset}\n`;
    output += `${COLORS.yellow}│${COLORS.reset}  Review warnings above. Use --fail-on-todo to block.       ${COLORS.yellow}│${COLORS.reset}\n`;
    output += `${COLORS.yellow}└────────────────────────────────────────────────────────────┘${COLORS.reset}\n`;
  } else {
    output += `${COLORS.green}┌────────────────────────────────────────────────────────────┐${COLORS.reset}\n`;
    output += `${COLORS.green}│${COLORS.reset}  ${COLORS.bright}All checks passed!${COLORS.reset} Safe to commit.                   ${COLORS.green}│${COLORS.reset}\n`;
    output += `${COLORS.green}└────────────────────────────────────────────────────────────┘${COLORS.reset}\n`;
  }

  return output;
}

module.exports = { formatReport, COLORS };
