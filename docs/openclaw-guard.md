# openclaw-guard

CLI guardrail that scans staged git diffs for AI-code risks.

## Quick Start

```bash
# From the vibe-coder-rules repo
cd tools/openclaw-guard

# Link locally (or use directly)
npm link

# Run in any git repo with staged changes
openclaw-guard
```

## Usage

```bash
openclaw-guard [options]

Options:
  --json          Output results as JSON
  --quiet         Only output on findings (exit code still set)
  --fail-on-todo  Treat TODO/FIXME as errors (default: warning)
  -h, --help      Show help
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No issues found |
| `1` | Blocking issues found (secrets, ghost files with --strict, etc.) |
| `2` | Scanner error or not a git repo |

## What It Detects

### Secrets (ERROR)
- AWS Access Keys (AKIA...)
- GitHub Tokens (ghp_, gho_, ghs_, etc.)
- Slack Tokens (xoxb-, xoxp-)
- Stripe Live Keys (sk_live_)
- OpenAI API Keys (sk-...)
- Private Keys (PEM format)
- Generic high-entropy secrets

### Ghost Files (WARN)
- JavaScript/TypeScript imports of missing files
- Python relative imports to non-existent modules
- CSS/SCSS `@import` of missing files
- Static asset references (images, fonts)

### TODO/FIXME (WARN or ERROR)
- `// TODO`, `# TODO` comments
- `// FIXME`, `# FIXME` comments  
- `STUB`, `PLACEHOLDER`, `XXX`, `HACK` markers
- `pass` statements in Python stubs
- `throw new Error('Not implemented')` in JS stubs

### Unresolved Imports (WARN)
- External dependencies without manifest entries
- Stub function detection
- Unresolved symbol usage

## Git Hook Setup

### Husky

```bash
npm install --save-dev husky
npx husky init

echo 'npx openclaw-guard' > .husky/pre-commit
```

### Manual

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npx openclaw-guard --quiet || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Guard
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx openclaw-guard --fail-on-todo
```

## Testing

```bash
cd tools/openclaw-guard
npm test
```

## Architecture

```
openclaw-guard/
├── bin/openclaw-guard.js      # CLI entry point
├── src/
│   ├── guard-runner.js        # Main orchestrator
│   ├── scan-results.js        # Results aggregation
│   ├── formatters.js          # Terminal output
│   └── scanners/
│       ├── secret-scanner.js  # Detects secrets
│       ├── ghost-file-scanner.js  # Detects missing imports
│       ├── todo-scanner.js    # Detects TODO/FIXME
│       └── import-scanner.js  # Detects stub/unresolved imports
└── tests/
    └── run-tests.js           # Test suite
```

## Why This Exists

AI coding assistants sometimes:
- Hallucinate file paths in imports
- Leave TODOs as "temporary" fixes
- Hardcode credentials for "testing"
- Generate stub functions you forget to fill in

This tool catches the obvious stuff before it hits your repo.

## License

MIT