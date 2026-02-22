# claw-context-audit

Audit instruction-file context cost, detect overlap, and generate a compact run brief.

## Why

AI coding sessions often burn context on repeated docs and stale instruction sprawl.

`claw-context-audit` gives you:
- estimated token cost per source file
- overlap/duplication signals
- a compressed `run-brief.md` you can paste before tasks

## Usage

From repo root:

```bash
./tools/claw-context-audit.sh
```

Audit another project path:

```bash
./tools/claw-context-audit.sh ../my-project
```

## Output

- `reports/context-audit.md`
  - token estimate by file
  - high-cost source list
  - overlap samples
  - estimated reduction vs generated brief
- `reports/run-brief.md`
  - compressed high-signal instruction block

## v1 Scope

Scans these source patterns (if present):
- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `.windsurfrules`
- `.ai-rules`
- `.codex/instructions.md`
- `README.md`
- `docs/**/*.md`, `tools/**/*.md`, `scripts/**/*.md`

## Notes

- Token numbers are estimates (`chars / 4`) for trend tracking, not billing-exact values.
- Compression is heuristic; source files remain canonical.
- Re-run after rule/policy changes to avoid drift.
