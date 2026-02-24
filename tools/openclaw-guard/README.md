# OpenClaw Guard 🔒

> CLI guardrail that scans staged git diffs for AI-code risks

Built for vibe coders who ship fast — but don't want to ship secrets, ghost files, or half-baked stubs.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/BChopLXXXII/openclaw-guard)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Quick Start

```bash
# Install globally
npm install -g openclaw-guard

# Or use npx (no install)
npx openclaw-guard

# Run in any git repo
cd your-project
openclaw-guard
```

---

## What It Catches

| Check | Description | Severity |
|-------|-------------|----------|
| **Secrets** | API keys, tokens, private keys, database URLs | 🔴 ERROR |
| **Ghost Files** | Imports/requires pointing to non-existent files | 🟡 WARN |
| **TODO/FIXME** | Incomplete markers left by agents | 🟡 WARN / 🔴 ERROR* |
| **Stub Functions** | Placeholder implementations | 🟡 WARN |
| **Unresolved Imports** | External deps without manifest entry | 🟡 WARN |

\* Use `--fail-on-todo` to treat TODOs as blocking errors

---

## Usage

```bash
# Basic scan of staged changes
openclaw-guard

# Short alias
oguard

# JSON output for CI/CD
openclaw-guard --json

# Only show output if issues found
openclaw-guard --quiet

# Treat TODO/FIXME as errors
openclaw-guard --fail-on-todo

# Combined options
openclaw-guard --json --fail-on-todo > scan-results.json
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No issues found ✓ |
| `1` | Blocking issues found ✗ |
| `2` | Scanner error or not a git repo |

---

## Git Hook Setup

### Husky (recommended)

```bash
npm install --save-dev husky
npx husky init

echo 'npx openclaw-guard' > .husky/pre-commit
```

### Manual pre-commit

```bash
# Create hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npx openclaw-guard --quiet
EOF

# Make executable
chmod +x .git/hooks/pre-commit
```

---

## Example Output

```
╔══════════════════════════════════════════════════════════════╗
║           OPENCLAW GUARD - AI-Code Risk Report               ║
╚══════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────┐
│  ✗ BLOCKING ISSUES FOUND                                   │
│     ● Errors: 1                                            │
│     ● Warnings: 2                                          │
│     ○ Total: 3                                             │
└────────────────────────────────────────────────────────────┘

▶ SECRETS
────────────────────────────────────────────────────────────
  [ERR] AWS Access Key ID
  File: src/config.js:12
  Code: const key = "AKIA..."
  Match: AKIA***IOSF

  [ERR] OpenAI API Key
  File: src/ai.js:5
  Code: apiKey: "sk-..."
  Match: sk-***test

▶ TODO-FIXME
────────────────────────────────────────────────────────────
  [WARN] Stub Function
  File: src/utils.js:42
  Code: function calculate() { return null; // TODO }
  Note: Function appears to be an incomplete stub

┌────────────────────────────────────────────────────────────┐
│  Commit blocked: Fix errors before committing              │
└────────────────────────────────────────────────────────────┘
```

---

## Secret Detection Patterns

OpenClaw Guard detects:

- **AWS**: Access keys, secret keys
- **GitHub**: Personal access tokens (ghp_, gho_, ghs_, etc.)
- **Slack**: Bot/user tokens (xoxb-, xoxp-)
- **Stripe**: Live secret keys (sk_live_)
- **OpenAI**: API keys (sk-...)
- **Generic**: High-entropy secrets, database URLs with passwords
- **Private Keys**: PEM-encoded RSA/DSA/EC keys

---

## Configuration

Currently, configuration is via CLI flags. Future versions will support `.openclawguardrc` files.

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Guard Checks

on: [push, pull_request]

jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run OpenClaw Guard
        run: npx openclaw-guard --fail-on-todo
```

### GitLab CI

```yaml
guard:
  script:
    - npx openclaw-guard --json --fail-on-todo > guard-report.json
  artifacts:
    reports:
      junit: guard-report.json
```

---

## Why OpenClaw Guard?

AI coding assistants are powerful, but they:
- Sometimes hallucinate file paths
- Leave TODOs as "temporary" fixes that become permanent
- Hardcode credentials for "testing"
- Generate stub functions you forget to implement

This tool catches the obvious stuff before it hits your repo.

---

## Roadmap

- [ ] `.openclawguardrc` config file support
- [ ] Custom pattern rules
- [ ] Integration with secret scanning APIs (opt-in)
- [ ] SARIF output format
- [ ] VS Code extension

---

## Contributing

This is a personal tool. Issues welcome, but PRs may not be accepted.

---

## License

MIT. Do whatever you want with these.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

Built for vibe coders who want to ship fast without the spaghetti.

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/openclaw-guard) — it helps others find it.
