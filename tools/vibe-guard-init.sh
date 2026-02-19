#!/usr/bin/env bash
# =============================================================================
# vibe-guard-init.sh — Architecture Lock for vibe-coder projects
# =============================================================================
# Usage:
#   ./tools/vibe-guard-init.sh             # Interactive mode
#   ./tools/vibe-guard-init.sh --dry-run   # Preview without writing
#
# What it does:
#   Asks 5 key architecture questions, then writes a locked ## Architecture Lock
#   block into CLAUDE.md in the current directory. Agents read this block every
#   session and enforce the decisions — preventing architecture drift.
#
# To update decisions: re-run this script. Do not edit the block manually.
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Flags ─────────────────────────────────────────────────────────────────────
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
separator() {
  echo -e "${BOLD}────────────────────────────────────────────────────────${RESET}"
}

ask_choice() {
  local question="$1"
  shift
  local options=("$@")
  local count="${#options[@]}"
  local choice

  echo ""
  echo -e "${BOLD}${question}${RESET}"
  for i in "${!options[@]}"; do
    echo -e "  ${CYAN}$((i+1))${RESET}. ${options[$i]}"
  done
  echo ""

  while true; do
    printf "  Enter choice [1-%d]: " "$count"
    read -r choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= count )); then
      ANSWER="${options[$((choice-1))]}"
      return 0
    fi
    echo -e "  ${RED}Invalid choice. Please enter a number between 1 and ${count}.${RESET}"
  done
}

ask_custom() {
  local prompt="$1"
  local custom_val
  printf "  %s: " "$prompt"
  read -r custom_val
  ANSWER="${custom_val:-other}"
}

pick_or_custom() {
  local question="$1"
  shift
  local options=("$@" "other (specify)")
  local count="${#options[@]}"
  local choice

  echo ""
  echo -e "${BOLD}${question}${RESET}"
  for i in "${!options[@]}"; do
    echo -e "  ${CYAN}$((i+1))${RESET}. ${options[$i]}"
  done
  echo ""

  while true; do
    printf "  Enter choice [1-%d]: " "$count"
    read -r choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= count )); then
      if (( choice == count )); then
        ask_custom "Specify your choice"
      else
        ANSWER="${options[$((choice-1))]}"
      fi
      return 0
    fi
    echo -e "  ${RED}Invalid choice. Please enter a number between 1 and ${count}.${RESET}"
  done
}

# ── Header ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║         🔒 vibe-guard-init — Architecture Lock        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Lock your architecture decisions once. Agents enforce them every session."
if $DRY_RUN; then
  echo -e "  ${YELLOW}[DRY RUN] — Preview mode. Nothing will be written.${RESET}"
fi
echo ""
separator

# ── Question 1: Framework ─────────────────────────────────────────────────────
pick_or_custom \
  "1. Framework — What UI framework does this project use?" \
  "React" "Next.js" "Vue" "Svelte" "vanilla (no framework)"
FRAMEWORK="$ANSWER"

# ── Question 2: Styling ───────────────────────────────────────────────────────
pick_or_custom \
  "2. Styling — How is CSS handled in this project?" \
  "Tailwind CSS" "CSS Modules" "styled-components" "vanilla CSS" "none"
STYLING="$ANSWER"

# ── Question 3: State Management ──────────────────────────────────────────────
pick_or_custom \
  "3. State Management — What state management approach is used?" \
  "useState only (no global state)" "Zustand" "Redux" "Jotai" "Context API" "none"
STATE="$ANSWER"

# ── Question 4: File Structure ────────────────────────────────────────────────
pick_or_custom \
  "4. File Structure — What file/folder convention does this project follow?" \
  "feature-based (group by feature)" "type-based (group by file type)" "flat (minimal nesting)"
FILE_STRUCTURE="$ANSWER"

# ── Question 5: Testing ───────────────────────────────────────────────────────
pick_or_custom \
  "5. Testing — What testing approach does this project use?" \
  "Vitest" "Jest" "Playwright" "none"
TESTING="$ANSWER"

# ── Confirmation ──────────────────────────────────────────────────────────────
separator
echo ""
echo -e "${BOLD}  Architecture decisions locked:${RESET}"
echo -e "  ${DIM}Framework:       ${RESET}${BOLD}${FRAMEWORK}${RESET}"
echo -e "  ${DIM}Styling:         ${RESET}${BOLD}${STYLING}${RESET}"
echo -e "  ${DIM}State mgmt:      ${RESET}${BOLD}${STATE}${RESET}"
echo -e "  ${DIM}File structure:  ${RESET}${BOLD}${FILE_STRUCTURE}${RESET}"
echo -e "  ${DIM}Testing:         ${RESET}${BOLD}${TESTING}${RESET}"
echo ""

if ! $DRY_RUN; then
  printf "  Write this to CLAUDE.md? [Y/n]: "
  read -r confirm
  if [[ "${confirm,,}" == "n" ]]; then
    echo ""
    echo -e "  ${YELLOW}Aborted. Nothing written.${RESET}"
    echo ""
    exit 0
  fi
fi

# ── Generate timestamp ────────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d %H:%M %Z')

# ── Build the Architecture Lock block ────────────────────────────────────────
LOCK_BLOCK=$(cat <<LOCKEOF
<!-- DO NOT MODIFY — generated by vibe-guard-init on ${TIMESTAMP} -->
## Architecture Lock

> ⚠️ These decisions are locked. Agents must enforce them every session.
> To change architecture decisions, re-run \`vibe-guard-init\`. Do not edit this block manually.

### Locked Decisions

| Decision         | Choice                         |
|------------------|-------------------------------|
| Framework        | ${FRAMEWORK}                  |
| Styling          | ${STYLING}                    |
| State Management | ${STATE}                      |
| File Structure   | ${FILE_STRUCTURE}              |
| Testing          | ${TESTING}                    |

### Agent Rules

1. **Framework** — All UI code must use **${FRAMEWORK}**. Do not introduce other frameworks or alternative rendering approaches.
2. **Styling** — All styles must use **${STYLING}**. Do not add inline styles, alternative CSS solutions, or mixing of styling methods unless the locked choice is already mixed.
3. **State Management** — Follow **${STATE}**. Do not add global state libraries not listed here. Do not suggest migrations.
4. **File Structure** — Organize new files using **${FILE_STRUCTURE}** convention. Do not restructure existing files without explicit instruction.
5. **Testing** — Write tests using **${TESTING}**. Do not add test files using a different framework.

### Enforcement

- If asked to deviate from any locked decision, refuse and explain the lock.
- If you believe a locked decision is wrong for the task, flag it for human review — do not silently change it.
- These rules supersede general best-practice suggestions. The human locked these intentionally.

<!-- END ARCHITECTURE LOCK -->
LOCKEOF
)

# ── Dry run: print and exit ───────────────────────────────────────────────────
if $DRY_RUN; then
  separator
  echo ""
  echo -e "${BOLD}  [DRY RUN] — Block that would be written to CLAUDE.md:${RESET}"
  echo ""
  echo "$LOCK_BLOCK"
  echo ""
  separator
  echo -e "  ${YELLOW}Nothing written. Remove --dry-run to apply.${RESET}"
  echo ""
  exit 0
fi

# ── Write to CLAUDE.md ────────────────────────────────────────────────────────
CLAUDE_FILE="$(pwd)/CLAUDE.md"

if [[ -f "$CLAUDE_FILE" ]]; then
  # Check if an existing Architecture Lock block is present
  if grep -q "<!-- DO NOT MODIFY — generated by vibe-guard-init" "$CLAUDE_FILE" 2>/dev/null; then
    echo -e "  ${YELLOW}Existing Architecture Lock found. Replacing it...${RESET}"
    # Remove old block between the comment markers
    python3 - "$CLAUDE_FILE" "$LOCK_BLOCK" <<'PYEOF'
import sys

filepath = sys.argv[1]
new_block = sys.argv[2]

with open(filepath, 'r') as f:
    content = f.read()

import re
pattern = r'<!-- DO NOT MODIFY — generated by vibe-guard-init.*?<!-- END ARCHITECTURE LOCK -->'
updated = re.sub(pattern, new_block, content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(updated)

print("replaced")
PYEOF
  else
    # Append to existing CLAUDE.md
    echo "" >> "$CLAUDE_FILE"
    echo "---" >> "$CLAUDE_FILE"
    echo "" >> "$CLAUDE_FILE"
    printf '%s\n' "$LOCK_BLOCK" >> "$CLAUDE_FILE"
    echo -e "  ${GREEN}Architecture Lock appended to existing CLAUDE.md${RESET}"
  fi
else
  # Create fresh CLAUDE.md with the lock block
  cat > "$CLAUDE_FILE" <<HEADER
# CLAUDE.md

This file is read by AI agents every session. It contains project-specific rules and context.

---

HEADER
  printf '%s\n' "$LOCK_BLOCK" >> "$CLAUDE_FILE"
  echo -e "  ${GREEN}CLAUDE.md created with Architecture Lock${RESET}"
fi

# ── Success ───────────────────────────────────────────────────────────────────
separator
echo ""
echo -e "  ${GREEN}${BOLD}✅ Architecture Lock written to CLAUDE.md${RESET}"
echo ""
echo -e "  ${DIM}File:${RESET} ${CLAUDE_FILE}"
echo -e "  ${DIM}Time:${RESET} ${TIMESTAMP}"
echo ""
echo -e "  Agents will now enforce these decisions every session."
echo -e "  To update: re-run ${BOLD}vibe-guard-init.sh${RESET}. Do not edit the block manually."
echo ""
