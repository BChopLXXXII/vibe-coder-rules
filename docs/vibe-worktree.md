# vibe-worktree — Parallel Claude Code Sessions

Run 3-4 Claude Code agents in parallel, each on its own branch, with zero context bleed.

---

## Why Worktrees?

When you run multiple Claude Code sessions in the same repo, they fight:
- One agent rewrites what another just fixed
- Context bleeds between sessions (you asked agent A to "stay focused on auth" — agent B doesn't know)
- Port conflicts when both try to run the dev server

Git worktrees solve this. Each worktree is a **separate checkout of your repo** on its own branch — same `.git` directory, different working tree. Claude Code runs in each one independently.

> "running 3-4 worktrees simultaneously with different claude sessions is genuinely how you get the output multiplier — each agent is isolated, no context bleed, and you can review diffs across them."
>
> — [r/ClaudeAI thread on Claude Code worktree tips](https://www.reddit.com/r/ClaudeAI/comments/1rae05r/5_claude_code_worktree_tips_from_creator_of_claude_code_in_feb_2026/)

Claude Code 2.1.49+ ships a native `--worktree` flag. `vibe-worktree` wraps the full workflow with port management, cleanup, and sane defaults.

---

## Quick Start

```bash
# From your repo root, create 3 parallel workspaces
./tools/vibe-worktree.sh create feat-auth
./tools/vibe-worktree.sh create feat-ui
./tools/vibe-worktree.sh create feat-api

# See all active worktrees + their ports
./tools/vibe-worktree.sh list

# Open Claude Code in one of them
./tools/vibe-worktree.sh launch feat-auth
```

Each worktree gets:
- A dedicated branch (`wt/feat-auth`)
- A `.env.local` with a unique `PORT` (3100, 3101, 3102…) — no conflicts
- A `WORKTREE.md` context file Claude can read for orientation

---

## Commands

```
vibe-worktree create <name> [base]   Create worktree + branch
vibe-worktree list                   List all worktrees with ports
vibe-worktree remove <name>          Remove worktree + delete branch
vibe-worktree launch <name>          Launch Claude Code in the worktree
vibe-worktree clean-merged           Remove worktrees merged to main
```

---

## The Pattern: Main as Integrator

The key discipline: **never work directly in main**. Keep main clean, review diffs, merge from worktrees.

```
main (always clean)
├── .worktrees/feat-auth/    ← Claude Code session 1
├── .worktrees/feat-ui/      ← Claude Code session 2
└── .worktrees/feat-api/     ← Claude Code session 3
```

**Workflow:**

1. `create` a worktree for each parallel track
2. `launch` Claude Code in each one (or open them in separate terminals/tmux panes)
3. Review diffs from each session independently
4. Merge approved branches to main
5. `clean-merged` to tidy up

---

## Port Management

Each worktree gets a unique `PORT` in `.env.local`. Ports start at 3100 (configurable) and auto-increment so you never get `EADDRINUSE`.

```bash
# Custom starting port
VIBE_BASE_PORT=4000 ./tools/vibe-worktree.sh create feat-auth

# Or set it in your shell profile
export VIBE_BASE_PORT=4000
```

---

## Claude Code 2.1.49+ Native Support

If you have Claude Code 2.1.49 or later, `vibe-worktree launch` automatically uses the native `--worktree` flag for deeper integration. It falls back to standard `claude` for older versions.

Check your version: `claude --version`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBE_WORKTREE_DIR` | `.worktrees/` | Where worktrees are created |
| `VIBE_BASE_PORT` | `3100` | Starting port, increments per worktree |
| `CLAUDE_CMD` | `claude` | Path or alias for the Claude CLI |

---

## Tips

- **Add `.worktrees/` to your root `.gitignore`** — worktrees are local scratch space
- **Keep sessions focused** — one worktree per task, not "worktree for everything"
- **Review across worktrees** — `git diff main...wt/feat-auth` before merging
- **Use `vibe-handoff`** in each worktree for session continuity between Claude restarts

---

## Related Tools

- [`vibe-handoff`](./vibe-handoff.md) — snapshot your session context so Claude picks up where it left off
- [`vibe-guard-init`](./vibe-guard-init.md) — lock your architecture decisions before unleashing parallel agents
