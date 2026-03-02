# claw-rules-broadcast

Sync `AGENTS.md` as your single source of truth across AI coding tools.

## Why this exists

If you build on Windows, symlinks are unreliable across tools/editors/shells. You end up with:

- `AGENTS.md` in one place
- stale `CLAUDE.md` somewhere else
- old `.cursorrules`
- drifting `codex.yaml` / `openai.yaml`

That config drift causes inconsistent agent behavior.

`claw-rules-broadcast` fixes that by generating target files from one source safely.

## What it syncs

Source (configurable):
- `AGENTS.md`

Targets:
- `CLAUDE.md` → full copy + generated header
- `.cursorrules` → markdown headings removed, rule bullets kept as plain text + header
- `codex.yaml` or `openai.yaml` → updates/creates `instructions:` block from extracted rules **only if file already exists** + header

Generated header:

```md
# Auto-synced from AGENTS.md by claw-rules-broadcast — do not edit directly
```

## Safety behavior

- If a target has manual edits (content doesn’t match expected generated output and no generated header), sync is **blocked** for that file.
- You get `conflict ❌` and a diff preview.
- The file is never overwritten automatically in conflict state.

## App UI

Dashboard shows:
- current source file path
- per-target status (`in-sync ✅`, `stale ⚠️`, `conflict ❌`, `missing`)
- manual sync button
- recent sync event log

## API

- `GET /api/status` → status for all targets
- `POST /api/sync` → run sync now
- `GET /api/config` → read config
- `POST /api/config` → update config (`sourcePath`, `targets`)

## Config file

Stored in project root:

- `broadcast-config.json`

Defaults:
- source: `/home/openclaw/.openclaw/workspace/AGENTS.md`
- targets: `CLAUDE.md` and `.cursorrules` in the same directory as source
- if `codex.yaml` exists, it is included by default; otherwise if `openai.yaml` exists, that is included

## Run

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Watch mode (`--watch`)

Sync continuously on AGENTS.md saves using native `fs.watch`:

```bash
node --experimental-strip-types src/lib/watcher.ts --watch
```

(Requires Node with TypeScript strip support, works in modern Node versions.)

## Build

```bash
npm run build
```

## License

MIT. Do whatever you want with these.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

Keeps your agent rules consistent across Claude, Cursor, and Codex/OpenAI configs.

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/claw-rules-broadcast) — it helps others find it.
