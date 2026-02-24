# Context Audit Report

- Root: `/home/openclaw/.openclaw/workspace/github/vibe-coder-rules`
- Mode: **strict**
- Files scanned: **5**
- Estimated pre-task context: **5228 tokens**
- Generated run brief: **491 tokens**
- Estimated reduction: **90.6%**

## Token Cost by Source

| File | Est. Tokens | Lines | Overlap Lines | Signal Ratio |
|---|---:|---:|---:|---:|
| `README.md` | 1826 | 270 | 12 | 0.44 |
| `docs/vibe-guard-init.md` | 1812 | 235 | 3 | 0.36 |
| `docs/vibe-worktree.md` | 1043 | 123 | 6 | 0.43 |
| `docs/claw-context-audit.md` | 333 | 61 | 2 | 0.64 |
| `docs/vibe-handoff.md` | 214 | 40 | 1 | 0.61 |

## Top Cost Drivers

- `README.md` — 1826 tokens
- `docs/vibe-guard-init.md` — 1812 tokens
- `docs/vibe-worktree.md` — 1043 tokens
- `docs/claw-context-audit.md` — 333 tokens
- `docs/vibe-handoff.md` — 214 tokens

## Findings

### High Cost Sources
- `README.md` is heavy (1826 tokens). Consider splitting or moving reference material out of startup context.
- `docs/vibe-guard-init.md` is heavy (1812 tokens). Consider splitting or moving reference material out of startup context.
- `docs/vibe-worktree.md` is heavy (1043 tokens). Consider splitting or moving reference material out of startup context.

## Shared Line Samples (Potential Duplication)

- **`README.md`, `docs/vibe-handoff.md`** → ./tools/vibe-handoff.sh --print
- **`README.md`, `docs/vibe-worktree.md`** → ./tools/vibe-worktree.sh create feat-auth
- **`README.md`, `docs/vibe-worktree.md`** → ./tools/vibe-worktree.sh create feat-ui
- **`README.md`, `docs/vibe-worktree.md`** → ./tools/vibe-worktree.sh create feat-api
- **`README.md`, `docs/vibe-worktree.md`** → ./tools/vibe-worktree.sh list
- **`README.md`, `docs/vibe-worktree.md`** → ./tools/vibe-worktree.sh launch feat-auth
- **`README.md`, `docs/vibe-worktree.md`** → - a dedicated branch (`x`)
- **`README.md`, `docs/claw-context-audit.md`** → ./tools/claw-context-audit.sh
- **`README.md`, `docs/claw-context-audit.md`** → ./tools/claw-context-audit.sh --strict
- **`README.md`, `docs/vibe-guard-init.md`** → mit. do whatever you want with these.
- **`README.md`, `docs/vibe-guard-init.md`** → made by [@bchoplxxxii](url
- **`README.md`, `docs/vibe-guard-init.md`** → if this helped, [star the repo](url — it helps others find it.
