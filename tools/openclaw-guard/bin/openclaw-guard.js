#!/usr/bin/env node

/**
 * OpenClaw Guard v1.0.0
 * CLI guardrail for scanning staged git diffs for AI-code risks
 * 
 * Usage:
 *   openclaw-guard [options]
 *   oguard [options]
 * 
 * Options:
 *   --json          Output results as JSON
 *   --quiet         Only output on findings (exit code still set)
 *   --fail-on-todo  Treat TODO/FIXME as errors (default: warning)
 *   --help          Show help
 */

const { GuardRunner } = require('../src/guard-runner');
const { formatReport } = require('../src/formatters');

const args = process.argv.slice(2);
const options = {
  json: args.includes('--json'),
  quiet: args.includes('--quiet'),
  failOnTodo: args.includes('--fail-on-todo'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    OPENCLAW GUARD v1.0.0                     ║
║         AI-Code Risk Scanner for Staged Commits              ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  openclaw-guard [options]
  oguard [options]

OPTIONS:
  --json          Output results as JSON
  --quiet         Only output on findings (exit code still set)
  --fail-on-todo  Treat TODO/FIXME as errors (default: warning)
  -h, --help      Show this help message

EXAMPLES:
  # Run all checks on staged changes
  $ openclaw-guard

  # JSON output for CI/CD pipelines
  $ openclaw-guard --json

  # Quiet mode - only show issues
  $ openclaw-guard --quiet

  # Treat TODOs as blocking errors
  $ openclaw-guard --fail-on-todo

EXIT CODES:
  0   No issues found
  1   One or more blocking issues found
  2   Scanner error or git not available

For more info: https://github.com/BChopLXXXII/openclaw-guard
`);
  process.exit(0);
}

async function main() {
  const runner = new GuardRunner(options);
  
  try {
    const results = await runner.scan();
    
    if (!options.quiet || results.hasIssues()) {
      if (options.json) {
        console.log(JSON.stringify(results.toJSON(), null, 2));
      } else {
        console.log(formatReport(results));
      }
    }
    
    process.exit(results.hasErrors() ? 1 : 0);
  } catch (error) {
    if (!options.quiet) {
      console.error(`\n❌ Scanner error: ${error.message}`);
    }
    process.exit(2);
  }
}

main();
