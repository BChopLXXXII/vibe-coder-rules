#!/usr/bin/env bash
set -euo pipefail

# setup-rules.sh
# Quick installer for CLAUDE.md / .cursorrules from this repo's templates.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$REPO_DIR/templates"

print_help() {
  cat <<'EOF'
Usage:
  ./scripts/setup-rules.sh --tool <claude|cursor> --stack <minimal|nextjs|api|fullstack|python> [--target <path>]

Examples:
  ./scripts/setup-rules.sh --tool claude --stack minimal
  ./scripts/setup-rules.sh --tool claude --stack nextjs --target ../my-app
  ./scripts/setup-rules.sh --tool cursor --stack python --target ~/code/bot

Notes:
  - --tool claude writes CLAUDE.md
  - --tool cursor writes .cursorrules
  - Existing files are never overwritten (rename/delete manually first)
EOF
}

die() {
  echo "❌ $*" >&2
  exit 1
}

TOOL=""
STACK=""
TARGET="$(pwd)"

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
[[ ! -e "$OUT_FILE" ]] || die "Refusing to overwrite existing file: $OUT_FILE"

cp "$TEMPLATE" "$OUT_FILE"

echo "✅ Installed $(basename "$OUT_FILE") from $(basename "$TEMPLATE")"
echo "📍 Location: $OUT_FILE"
echo "👉 Next: open the file and replace [PLACEHOLDER] values."
