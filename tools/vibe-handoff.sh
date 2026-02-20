#!/usr/bin/env bash
set -euo pipefail

OUT_FILE="HANDOFF.md"
ROOT="$(pwd)"

usage() {
  cat <<USAGE
vibe-handoff - snapshot project context for next AI session

Usage:
  ./tools/vibe-handoff.sh [options]

Options:
  --out <file>       Output file (default: HANDOFF.md)
  --root <path>      Project root to scan (default: current directory)
  --print            Also print handoff to stdout
  --help             Show help
USAGE
}

PRINT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      OUT_FILE="${2:-}"; shift 2 ;;
    --root)
      ROOT="${2:-}"; shift 2 ;;
    --print)
      PRINT=1; shift ;;
    --help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$OUT_FILE" || -z "$ROOT" ]]; then
  echo "--out and --root require values" >&2
  exit 1
fi

cd "$ROOT"
if [[ ! -d .git ]]; then
  echo "Warning: no .git directory found; git sections will be limited." >&2
fi

TS="$(date '+%Y-%m-%d %H:%M %Z')"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'n/a')"
LAST_COMMIT="$(git log -1 --pretty='format:%h %s' 2>/dev/null || echo 'n/a')"

GIT_STATUS="$(git status --short 2>/dev/null || true)"
if [[ -z "$GIT_STATUS" ]]; then
  GIT_STATUS="clean"
fi

RECENT="$(git log --oneline -5 2>/dev/null || true)"
if [[ -z "$RECENT" ]]; then
  RECENT="n/a"
fi

FILES="$(find . -maxdepth 2 -type f \
  ! -path './.git/*' \
  ! -path './node_modules/*' \
  ! -path './dist/*' \
  ! -path './build/*' \
  | sed 's#^\./##' \
  | sort \
  | head -n 25)"

cat > "$OUT_FILE" <<MD
# Handoff Snapshot

Generated: $TS
Repo: $(basename "$ROOT")
Branch: $BRANCH

## Goal
- Fill this in before ending your session.

## What changed
- Fill this in with the concrete changes made.

## Current git state
\
$GIT_STATUS

## Last commit
- $LAST_COMMIT

## Recent commits
\
$RECENT

## Key files (top 25)
\
$FILES

## Next steps
1. Fill in exactly what should happen next.
2. Include one command to run first.
3. Include one risk to watch.

## Resume prompt
"Continue from HANDOFF.md: finish next steps in order, run tests, and open/update PR if ready."
MD

if [[ $PRINT -eq 1 ]]; then
  cat "$OUT_FILE"
fi

echo "Wrote $OUT_FILE"
