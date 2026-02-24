#!/usr/bin/env bash
# =============================================================================
# openclaw-guard.sh — pre-commit guardrail for AI-generated code risks
# =============================================================================
# Scans staged changes (git diff --staged) for:
#   1) Ghost/hallucinated local imports to missing files
#   2) Secret patterns (keys/tokens/private key material)
#   3) TODO/FIXME bombs left in staged additions
#   4) Best-effort unresolved imported symbols (named imports not exported)
#
# Exit codes:
#   0 = clean
#   1 = findings detected
#   2 = usage / environment error
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "${RED}error:${RESET} openclaw-guard must run inside a git repository"
  exit 2
fi

if [[ -z "$(git diff --staged --name-only)" ]]; then
  echo -e "${YELLOW}openclaw-guard:${RESET} no staged changes"
  exit 0
fi

DIFF_TEXT="$(git diff --staged --unified=0 --no-color)"
STAGED_FILES="$(git diff --staged --name-only --diff-filter=ACMR)"

SECRETS=()
TODOS=()
GHOST_IMPORTS=()
UNRESOLVED_SYMBOLS=()

# --- helpers -----------------------------------------------------------------

push_finding() {
  local -n arr=$1
  local value="$2"
  arr+=("$value")
}

is_relative_spec() {
  local spec="$1"
  [[ "$spec" == ./* || "$spec" == ../* || "$spec" == . || "$spec" == .. ]]
}

resolve_import_target() {
  local importer="$1"
  local spec="$2"
  local importer_dir target_base candidate

  importer_dir="$(dirname "$importer")"
  target_base="${importer_dir}/${spec}"

  # strip trailing slashes to avoid //index lookups
  target_base="${target_base%/}"

  local exts=("" .js .jsx .ts .tsx .mjs .cjs .json)

  for ext in "${exts[@]}"; do
    candidate="${target_base}${ext}"
    if git cat-file -e ":${candidate}" 2>/dev/null || [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  for ext in .js .jsx .ts .tsx .mjs .cjs .json; do
    candidate="${target_base}/index${ext}"
    if git cat-file -e ":${candidate}" 2>/dev/null || [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

extract_exports() {
  local file="$1"
  local content

  if git cat-file -e ":${file}" 2>/dev/null; then
    content="$(git show ":${file}" 2>/dev/null || true)"
  elif [[ -f "$file" ]]; then
    content="$(cat "$file")"
  else
    return 0
  fi

  # Named exports (best effort for common TS/JS patterns)
  printf '%s\n' "$content" | \
    grep -oE 'export[[:space:]]+(const|let|var|function|class|type|interface|enum)[[:space:]]+[A-Za-z_][A-Za-z0-9_]*' | \
    awk '{print $3}'

  printf '%s\n' "$content" | \
    grep -oE 'export[[:space:]]*\{[^}]+\}' | \
    sed -E 's/^export[[:space:]]*\{//; s/\}$//' | tr ',' '\n' | \
    sed -E 's/[[:space:]]+as[[:space:]]+.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//' | \
    grep -E '^[A-Za-z_][A-Za-z0-9_]*$' || true
}

# --- 1) secrets + TODO/FIXME in added lines ---------------------------------
current_file=""
while IFS= read -r line; do
  if [[ "$line" =~ ^\+\+\+[[:space:]]b/(.*)$ ]]; then
    current_file="${BASH_REMATCH[1]}"
    continue
  fi

  [[ "$line" =~ ^\+\+\+ ]] && continue
  [[ "$line" =~ ^\+ ]] || continue
  [[ -z "$current_file" ]] && continue
  added="${line:1}"

  case "$current_file" in
    *.md|*.txt|docs/*) continue ;;
  esac

  # secrets (best effort, tuned for high-signal patterns)
  if echo "$added" | grep -Eqi '(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z\-_]{35}|sk-[A-Za-z0-9]{20,}|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|[Pp]assword[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']{6,}["'\'']|[Aa]pi[_-]?[Kk]ey[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']{10,}["'\'']|[Tt]oken[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']{10,}["'\''])'; then
    push_finding SECRETS "${current_file}: ${added}"
  fi

  if echo "$added" | grep -Eqi '^[[:space:]]*(#|//|/\*|\*|--|;|<!--).*\b(TODO|FIXME|XXX|HACK)[[:space:]]*[:(]'; then
    push_finding TODOS "${current_file}: ${added}"
  fi
done <<< "$DIFF_TEXT"

# --- 2) ghost imports + unresolved symbols -----------------------------------
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) ;;
    *) continue ;;
  esac

  if ! git cat-file -e ":${file}" 2>/dev/null; then
    # Deleted/renamed away in index snapshot
    continue
  fi

  file_content="$(git show ":${file}")"

  # import x from '...'; import {A,B} from '...'
  while IFS= read -r import_line; do
    spec="$(echo "$import_line" | sed -E "s/.*from[[:space:]]+['\"]([^'\"]+)['\"].*/\1/")"

    if is_relative_spec "$spec"; then
      if ! target="$(resolve_import_target "$file" "$spec")"; then
        push_finding GHOST_IMPORTS "${file}: ${spec}"
      else
        # Named import symbol check
        if echo "$import_line" | grep -Eq 'import[[:space:]]*\{[^}]+\}[[:space:]]*from'; then
          imports="$(echo "$import_line" | sed -E "s/.*\{([^}]+)\}.*/\1/" | tr ',' '\n' | sed -E 's/[[:space:]]+as[[:space:]]+.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//' | grep -E '^[A-Za-z_][A-Za-z0-9_]*$' || true)"
          exports="$(extract_exports "$target" | sort -u || true)"

          while IFS= read -r sym; do
            [[ -z "$sym" ]] && continue
            if ! echo "$exports" | grep -qx "$sym"; then
              push_finding UNRESOLVED_SYMBOLS "${file}: ${sym} not exported by ${target}"
            fi
          done <<< "$imports"
        fi
      fi
    fi
  done < <(printf '%s\n' "$file_content" | grep -E "^[[:space:]]*import[[:space:]].*from[[:space:]]+['\"][^'\"]+['\"];?" || true)

  # const {A,B}=require('./x')
  while IFS= read -r req_line; do
    spec="$(echo "$req_line" | sed -E "s/.*require\([[:space:]]*['\"]([^'\"]+)['\"][[:space:]]*\).*/\1/")"
    if is_relative_spec "$spec"; then
      if ! target="$(resolve_import_target "$file" "$spec")"; then
        push_finding GHOST_IMPORTS "${file}: ${spec}"
      else
        destructured="$(echo "$req_line" | sed -nE 's/^[[:space:]]*const[[:space:]]*\{([^}]+)\}[[:space:]]*=.*/\1/p' | tr ',' '\n' | sed -E 's/[[:space:]]+as[[:space:]]+.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//' || true)"
        if [[ -n "$destructured" ]]; then
          exports="$(extract_exports "$target" | sort -u || true)"
          while IFS= read -r sym; do
            [[ -z "$sym" ]] && continue
            if ! echo "$exports" | grep -qx "$sym"; then
              push_finding UNRESOLVED_SYMBOLS "${file}: ${sym} not exported by ${target}"
            fi
          done <<< "$destructured"
        fi
      fi
    fi
  done < <(printf '%s\n' "$file_content" | grep -E "require\([[:space:]]*['\"][^'\"]+['\"][[:space:]]*\)" || true)

  # explicit unresolved stubs in staged file content
  while IFS= read -r stub_line; do
    push_finding UNRESOLVED_SYMBOLS "${file}: ${stub_line}"
  done < <(printf '%s\n' "$file_content" | grep -E 'TODO:[[:space:]]*implement|FIXME:[[:space:]]*implement|throw new Error\(["'\''](Not implemented|TODO)["'\'']\)|@ts-ignore|eslint-disable' || true)
done <<< "$STAGED_FILES"

# --- report ------------------------------------------------------------------
print_section() {
  local title="$1"
  local color="$2"
  shift 2
  local items=("$@")

  if (( ${#items[@]} == 0 )); then
    return
  fi

  echo -e "${color}${BOLD}${title}${RESET}"
  for item in "${items[@]}"; do
    echo -e "  - ${item}"
  done
  echo ""
}

TOTAL=$(( ${#SECRETS[@]} + ${#TODOS[@]} + ${#GHOST_IMPORTS[@]} + ${#UNRESOLVED_SYMBOLS[@]} ))

echo -e "${CYAN}${BOLD}openclaw guard — staged diff scan${RESET}"
echo ""

print_section "[SECRETS]" "$RED" "${SECRETS[@]}"
print_section "[TODO/FIXME BOMBS]" "$YELLOW" "${TODOS[@]}"
print_section "[GHOST IMPORTS]" "$RED" "${GHOST_IMPORTS[@]}"
print_section "[UNRESOLVED SYMBOLS/STUBS]" "$YELLOW" "${UNRESOLVED_SYMBOLS[@]}"

if (( TOTAL > 0 )); then
  echo -e "${RED}${BOLD}✖ Guard failed:${RESET} ${TOTAL} finding(s). Fix before commit."
  exit 1
fi

echo -e "${GREEN}${BOLD}✔ Guard passed:${RESET} no risky patterns in staged diff."
exit 0
