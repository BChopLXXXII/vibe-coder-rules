# claw-morning-brief

A dark-theme Next.js dashboard + API that generates a structured morning brief from local overnight activity.

It parses:
- OpenClaw session logs (local metadata)
- `memory/YYYY-MM-DD.md` files
- git commit/diff history
- recently changed files in the workspace

Then writes:
- `briefs/morning-brief-YYYY-MM-DD.md`

No external API calls are made during brief generation.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Environment variables

- `WORKSPACE_DIR` (optional)
  - Workspace root to scan.
  - Default: `/home/openclaw/.openclaw/workspace`

- `LOOKBACK_HOURS` (optional)
  - How far back to scan memory/git/file changes.
  - Default: `8`

## API endpoints

- `POST /api/generate`
  - Generates a new brief and saves it into `briefs/`
  - Accepts optional JSON body:
    - `workspaceDir`
    - `lookbackHours`

- `GET /api/briefs`
  - Lists generated briefs

- `GET /api/briefs/:date`
  - Returns a specific brief by date (`YYYY-MM-DD`)

## UI routes

- `/` dashboard (generate + latest brief)
- `/briefs` brief list
- `/briefs/[date]` full brief view

## License

MIT. Do whatever you want with these.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

Wake up to a clean overnight build report instead of digging through logs.

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/claw-morning-brief) — it helps others find it.
