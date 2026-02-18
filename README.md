# Vibe Coder Rules

CLAUDE.md and .cursorrules templates for vibe coders.

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
