# Vibe Coder Rules

CLAUDE.md, .cursorrules, and .codex templates for vibe coders — plus **rule-sync** to keep them all in sync from one file.

Simple. Commented. Under 100 lines. Actually useful.

---

## Why This Exists

Most AI coding rule files are written by senior devs for senior devs. They're 300+ lines of dense config that beginners don't understand.

These templates are different:

- **Under 100 lines** — AI tools work better with concise instructions
- **Heavily commented** — every section explains WHY it exists
- **Beginner-friendly** — no assumed knowledge
- **Copy-paste ready** — drop it in your project and go

---

## What's Included

### CLAUDE.md Templates

For Claude Code, OpenClaw, and any tool that reads CLAUDE.md:

| Template | Best For |
|----------|----------|
| `templates/claude-minimal.md` | Quick start, any project |
| `templates/claude-nextjs.md` | Next.js + React projects |
| `templates/claude-api.md` | Backend/API projects |
| `templates/claude-fullstack.md` | Full-stack apps |

### .cursorrules Templates

For Cursor IDE:

| Template | Best For |
|----------|----------|
| `templates/cursorrules-minimal.txt` | Quick start |
| `templates/cursorrules-nextjs.txt` | Next.js projects |
| `templates/cursorrules-python.txt` | Python projects |

---

## How to Use

1. Pick a template that matches your project
2. Copy it to your project root
3. Rename to `CLAUDE.md` or `.cursorrules`
4. Edit the `[PLACEHOLDERS]` with your details
5. Start coding

That's it. No install. No config. Just rules.

### Optional: one-command local setup

If you cloned this repo, you can install a template into any local project:

```bash
./scripts/setup-rules.sh --tool claude --stack minimal --target ../my-project
```

Other examples:

```bash
./scripts/setup-rules.sh --tool claude --stack nextjs --target ../my-next-app
./scripts/setup-rules.sh --tool cursor --stack python --target ../my-bot
```

The script is safe by default: it **won't overwrite** existing `CLAUDE.md` or `.cursorrules` files.

If you intentionally want to replace an existing file, use:

```bash
./scripts/setup-rules.sh --tool claude --stack minimal --target ../my-project --force
```

---

## 🔄 rule-sync — One Config, Every Agent

Tired of maintaining separate `CLAUDE.md`, `.cursorrules`, `.codex/instructions.md`, and `.windsurfrules` files? **rule-sync** lets you write your rules once and sync them everywhere.

### How It Works

1. **Initialize** a single `.ai-rules` source file:
   ```bash
   ./scripts/rule-sync.sh --init
   ```

2. **Edit** `.ai-rules` with your project's rules (it's a simple YAML-ish format)

3. **Sync** to all your AI coding agents:
   ```bash
   ./scripts/rule-sync.sh --force
   ```

That's it. One file generates:
- `CLAUDE.md` — Claude Code, OpenClaw
- `.cursor/rules` — Cursor IDE
- `.codex/instructions.md` — OpenAI Codex CLI
- `.windsurfrules` — Windsurf IDE
- `AGENTS.md` — GitHub Copilot Workspace

### Options

```bash
# Sync only specific targets
./scripts/rule-sync.sh --targets claude,cursor --force

# Preview without writing
./scripts/rule-sync.sh --dry-run

# Watch for changes and auto-sync
./scripts/rule-sync.sh --watch --force

# Use a custom source file
./scripts/rule-sync.sh --source my-rules.yml --force
```

### Why?

People keep asking: *"How do I keep my Claude Code and Cursor configs in sync?"* Now you don't have to. Edit one file, run one command.

---

## 🧠 vibe-handoff — Keep Session Context Between Agents

AI sessions forget. `vibe-handoff` creates a fast `HANDOFF.md` snapshot so your next agent run starts with context instead of guessing.

```bash
./tools/vibe-handoff.sh --print
```

What it captures:
- current branch + last commit
- current git status (including uncommitted changes)
- recent commit history
- key files in the repo
- a structured handoff template (Goal / What changed / Next steps / Resume prompt)

More usage examples: `docs/vibe-handoff.md`

---

## ⚡ vibe-worktree — Parallel Claude Code Sessions

Run multiple Claude Code agents simultaneously, each isolated on its own branch. No context bleed, no port conflicts.

```bash
# Spin up 3 parallel Claude Code workspaces
./tools/vibe-worktree.sh create feat-auth
./tools/vibe-worktree.sh create feat-ui
./tools/vibe-worktree.sh create feat-api

# See all active sessions + ports
./tools/vibe-worktree.sh list

# Open Claude Code in one
./tools/vibe-worktree.sh launch feat-auth

# Clean up merged branches
./tools/vibe-worktree.sh clean-merged
```

Each worktree gets:
- A dedicated branch (`wt/feat-auth`)
- A unique dev port in `.env.local` — no `EADDRINUSE`
- A `WORKTREE.md` context file Claude reads for orientation

Built for Claude Code 2.1.49+ (auto-uses native `--worktree` flag). Falls back gracefully for older versions.

More: `docs/vibe-worktree.md`

---

## 🛡️ openclaw guard — Staged Diff Risk Scanner

Catch risky AI artifacts *before* commit.

```bash
./tools/openclaw-guard.sh
```

What v1 scans in `git diff --staged`:
- ghost/hallucinated local imports (missing files)
- secrets (keys/tokens/private key patterns)
- TODO/FIXME/XXX/HACK bombs
- unresolved/invented import symbols (best-effort static check)

Output is colorized and returns non-zero on findings, so it works in pre-commit hooks and CI.

More: `docs/openclaw-guard.md`

---

## Quick Start

**For Claude Code / OpenClaw:**
```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/BChopLXXXII/vibe-coder-rules/main/templates/claude-minimal.md
```

**For Cursor:**
```bash
curl -o .cursorrules https://raw.githubusercontent.com/BChopLXXXII/vibe-coder-rules/main/templates/cursorrules-minimal.txt
```

---

## The 100-Line Rule

AI coding tools perform better with shorter, focused instruction files. Here's why:

- **Less context = faster responses** — the AI spends less time parsing your rules
- **Clearer instructions = better output** — ambiguity causes hallucinations
- **Easier to maintain** — you'll actually update a short file

If your CLAUDE.md is over 150 lines, you're probably overcomplicating it.

---

## Best Practices

1. **Start minimal** — add rules only when you hit problems
2. **Be specific** — "use TypeScript" beats "use modern practices"
3. **Include examples** — show the AI what good code looks like
4. **Update regularly** — your rules should evolve with your project

---

## See Also

**Want more comprehensive templates?** Check out [claude-md-templates](https://github.com/BChopLXXXII/claude-md-templates) — detailed CLAUDE.md files with full stack configs, patterns, and conventions.

## License

MIT. Do whatever you want with these.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

AI rules for humans who'd rather ship than configure.

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/vibe-coder-rules) — it helps others find it.
