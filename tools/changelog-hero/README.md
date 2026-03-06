# changelog-hero

> Auto-generate CHANGELOG.md from git commits. Ship fast, keep users informed, zero effort.

## Who is this for?

**"Ship-Weekly Sam"** — indie hackers releasing 2+ updates per week who want users to see what's new but hate manual documentation.

If you've ever shipped a feature and forgot to update the changelog, leaving users in the dark, this tool is for you.

## Quick Start

```bash
# 1. Install globally
npm install -g changelog-hero

# 2. Generate changelog from last tag to now
changelog-hero generate

# 3. See your new CHANGELOG.md
cat CHANGELOG.md
```

That's it. Your changelog now matches your git history.

## How It Works

`changelog-hero` reads your git commits since the last tag (or from the beginning) and groups them by conventional commit type:

- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes  
- `docs:` → 📚 Documentation
- `perf:` → ⚡️ Performance
- `refactor:` → ♻️ Refactoring
- `break:` → 💥 Breaking Changes
- etc.

## Commands

### `changelog-hero generate`

Generate changelog from git commits:

```bash
# From last tag to HEAD
changelog-hero generate

# Specific tag range
changelog-hero generate --from v1.0.0 --to v1.1.0

# Include author names
changelog-hero generate --include-messages

# Output to custom file
changelog-hero generate --output RELEASE.md
```

Output:
```markdown
# Changelog

Generated on 2026-03-06

## v1.2.0 → HEAD

### ✨ Features

- Add new dashboard (a1b2c3d)
- User profile page (e5f6g7h)

### 🐛 Bug Fixes

- Fix login redirect (i9j0k1l)
```

### `changelog-hero init`

Create a config file:

```bash
changelog-hero init
```

Creates `changelog-hero.json` with default.

## CI settings/CD Integration

Add to your release workflow:

```yaml
- name: Generate changelog
  run: npx changelog-hero generate
```

Then commit the generated CHANGELOG.md with your release.

## Commit Message Format

For best results, use conventional commits:

```
feat: add new login page
fix: resolve auth redirect issue
docs: update README
perf: improve database query
refactor: simplify user service
```

The tool automatically extracts the type and message.

## Monetization

- **Free:** CLI for individual devs
- **Paid:** GitHub Action + hosted changelog page ($12/mo)

---

## License

MIT.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/changelog-hero) — it helps others find it.
