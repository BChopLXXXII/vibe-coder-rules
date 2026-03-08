# claw-guardian

Catch AI-generated code smells before they become production disasters.

## Who is this for?

Solo founders and vibe coders using Claude Code/Cursor who ship fast without a senior engineer reviewing every PR.

If your current workflow is "ship it and pray," this is your safety check.

## Why this exists

Current workaround is painful:
- post code screenshots on X/Reddit asking "is this safe?"
- paste files into another AI for a second opinion
- or just push and find out in prod

`claw-guardian` gives you a fast local scan before you ship.

## Quick start (under 2 minutes)

```bash
cd projects/tool-scout-builds/claw-guardian
npm install
npm run build
node dist/index.js scan --dir ..
```

JSON output for CI:

```bash
node dist/index.js scan --dir .. --json
```

## What it detects in v0.1

- hallucinated `fetch(... timeout: ...)` usage
- JWT/token usage in localStorage
- hardcoded secret-like strings
- mock URLs left in production code
- sensitive data logs
- auth bypass flags
- `eval` / `new Function`
- permissive CORS `*`
- and more

## Monetization angle

- **Free:** local scans for personal projects
- **Pro (planned):** CI integration, custom rulesets, team policy packs

## Notes

This is intentionally CLI-first so it fits the exact workflow of solo builders shipping from terminal + editor.
