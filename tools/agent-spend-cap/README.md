# agent-spend-cap

Set a hard budget before your coding-agent run so you never wake up to a surprise bill.

## Who is this for?

**API-Billed Alex**: solo founders using Codex/Cursor/Claude Code with usage-based billing who want hard spend guardrails.

## What it does (v1)

- Set per-run hard budget caps
- Alert at warning thresholds (50/75/90 by default)
- Show session + sub-agent spend breakdown
- Exit non-zero when hard cap is hit (so scripts/automation can stop)

## Quick start (under 2 minutes)

```bash
npm install
npm run build

# 1) create budget policy
npx tsx src/cli.ts init --budget 25 --warn 50,75,90

# 2) run spend check on your usage log (NDJSON)
npx tsx src/cli.ts check --log ./sample-usage.ndjson
```

## Log format

Each line in your log file should be JSON:

```json
{"timestamp":"2026-03-04T01:10:00Z","tool":"codex","sessionId":"run-001","subagent":"ui","costUsd":2.15}
```

## Monetization angle

Freemium wedge:
- Free: one-tool local checker
- Paid: multi-tool ingestion, policy packs, Slack/Discord alerts, hosted dashboard

## License

MIT.
