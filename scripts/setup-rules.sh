#!/usr/bin/env bash
set -euo pipefail

# setup-rules.sh
# Quick installer for CLAUDE.md / .cursorrules from this repo's templates.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$REPO_DIR/templates"

print_help() {
  cat <<'EOF'
Usage:
  ./scripts/setup-rules.sh --tool <claude|cursor> --stack <minimal|nextjs|api|fullstack|python> [--target <path>] [--force]

Examples:
  ./scripts/setup-rules.sh --tool claude --stack minimal
  ./scripts/setup-rules.sh --tool claude --stack nextjs --target ../my-app
  ./scripts/setup-rules.sh --tool cursor --stack python --target ~/code/bot
  ./scripts/setup-rules.sh --tool claude --stack api --target ../my-api --force

Notes:
  - --tool claude writes CLAUDE.md
  - --tool cursor writes .cursorrules
  - Existing files are never overwritten unless you pass --force
EOF
}

die() {
  echo "❌ $*" >&2
  exit 1
}

TOOL=""
STACK=""
TARGET="$(pwd)"
FORCE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL="${2:-}"
      shift 2
      ;;
    --stack)
      STACK="${2:-}"
      shift 2
      ;;
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --force)
      FORCE="true"
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      die "Unknown argument: $1 (try --help)"
      ;;
  esac
done

[[ -n "$TOOL" ]] || die "Missing required arg: --tool"
[[ -n "$STACK" ]] || die "Missing required arg: --stack"
[[ -d "$TARGET" ]] || die "Target directory does not exist: $TARGET"

case "$TOOL" in
  claude)
    case "$STACK" in
      minimal|nextjs|api|fullstack) TEMPLATE="$TEMPLATE_DIR/claude-$STACK.md" ;;
      *) die "Invalid stack for claude: $STACK (use minimal|nextjs|api|fullstack)" ;;
    esac
    OUT_FILE="$TARGET/CLAUDE.md"
    ;;
  cursor)
    case "$STACK" in
      minimal|nextjs|python) TEMPLATE="$TEMPLATE_DIR/cursorrules-$STACK.txt" ;;
      *) die "Invalid stack for cursor: $STACK (use minimal|nextjs|python)" ;;
    esac
    OUT_FILE="$TARGET/.cursorrules"
    ;;
  *)
    die "Invalid --tool: $TOOL (use claude|cursor)"
    ;;
esac

[[ -f "$TEMPLATE" ]] || die "Template not found: $TEMPLATE"
if [[ -e "$OUT_FILE" && "$FORCE" != "true" ]]; then
  die "Refusing to overwrite existing file: $OUT_FILE (pass --force to overwrite)"
fi

cp "$TEMPLATE" "$OUT_FILE"

echo "✅ Installed $(basename "$OUT_FILE") from $(basename "$TEMPLATE")"
echo "📍 Location: $OUT_FILE"
if [[ "$FORCE" == "true" ]]; then
  echo "⚠️  Overwrite mode was enabled (--force)"
fi
echo "👉 Next: open the file and replace [PLACEHOLDER] values."
