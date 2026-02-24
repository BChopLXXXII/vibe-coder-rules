# Run Brief (Compressed)

Use this as the high-signal context block before coding. Regenerate with `./tools/claw-context-audit.sh`.

- Mode: **strict**
- Source files: 5
- Estimated tokens: 491 (down from ~5228, -90.6%)

## Core Instructions
- bash 4.0+ (macOS ships with 3.x — use `brew install bash` if needed, or run via `bash ./tools/vibe-guard-init.sh`)
- [`vibe-guard-init`](./vibe-guard-init.md) — lock your architecture decisions before unleashing parallel agents
./scripts/setup-rules.sh --tool claude --stack minimal --target ../my-project
./scripts/setup-rules.sh --tool claude --stack nextjs --target ../my-next-app
./scripts/setup-rules.sh --tool cursor --stack python --target ../my-bot
./scripts/setup-rules.sh --tool claude --stack minimal --target ../my-project --force
./scripts/rule-sync.sh --init
./scripts/rule-sync.sh --force
./scripts/rule-sync.sh --targets claude,cursor --force
./scripts/rule-sync.sh --dry-run
./scripts/rule-sync.sh --watch --force
./scripts/rule-sync.sh --source my-rules.yml --force
./tools/openclaw-guard.sh
./tools/vibe-guard-init.sh
./tools/vibe-guard-init.sh --dry-run
$ ./tools/vibe-guard-init.sh
See [`tests/vibe-guard-init/fixture-nextjs-cssmodules-none.md`](../tests/vibe-guard-init/fixture-nextjs-cssmodules-none.md) for the exact output this produces.
- **Review across worktrees** — `git diff main...wt/feat-auth` before merging
- [`vibe-handoff`](./vibe-handoff.md) — snapshot your session context so Claude picks up where it left off
- python3 (for replace-in-place when updating an existing lock — standard on modern systems)
./tools/vibe-handoff.sh --print
./tools/vibe-worktree.sh create feat-auth
./tools/vibe-worktree.sh create feat-ui
./tools/vibe-worktree.sh create feat-api
./tools/vibe-worktree.sh list
./tools/vibe-worktree.sh launch feat-auth
./tools/vibe-worktree.sh clean-merged
What v1 scans in `git diff --staged`:
./tools/claw-context-audit.sh
./tools/claw-context-audit.sh --strict
./tools/claw-context-audit.sh ../my-project
./tools/claw-context-audit.sh --strict ../my-project
./tools/vibe-handoff.sh
./tools/vibe-handoff.sh --out docs/HANDOFF-TODAY.md
./tools/vibe-handoff.sh --root ../my-project --out ../my-project/HANDOFF.md

## Notes
- Heuristic compression only; source files remain canonical policy.
- Re-run after policy changes to avoid drift.
