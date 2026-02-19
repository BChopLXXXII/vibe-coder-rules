#!/usr/bin/env bash
# rule-sync.sh — One config, every AI coding agent.
#
# Reads a single .ai-rules source file and syncs it to:
#   - CLAUDE.md (Claude Code, OpenClaw)
#   - .cursor/rules (Cursor IDE)
#   - .codex/instructions.md (OpenAI Codex CLI)
#   - .windsurfrules (Windsurf IDE)
#   - AGENTS.md (Copilot Workspace / generic)
#
# Usage:
#   ./scripts/rule-sync.sh [OPTIONS]
#
# Options:
#   --source <file>   Source rules file (default: .ai-rules)
#   --target <dir>    Project root to write to (default: current directory)
#   --targets <list>  Comma-separated targets: claude,cursor,codex,windsurf,agents (default: all)
#   --dry-run         Show what would be written without writing
#   --watch           Re-sync when source file changes (requires inotifywait or fswatch)
#   --force           Overwrite existing files without confirmation
#   --init            Create a starter .ai-rules file
#   -h, --help        Show this help

set -euo pipefail

VERSION="1.0.0"

# Defaults
SOURCE=".ai-rules"
TARGET_DIR="."
TARGETS="claude,cursor,codex,windsurf,agents"
DRY_RUN=false
WATCH=false
FORCE=false
INIT=false

# Colors (disabled if NO_COLOR set or not a terminal)
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  RED='\033[0;31m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN='' YELLOW='' RED='' CYAN='' BOLD='' NC=''
fi

info()  { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; }
dry()   { echo -e "${CYAN}[dry-run]${NC} $*"; }

usage() {
  sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# \?//'
  echo ""
  sed -n '/^# Options:/,/^[^#]/p' "$0" | sed 's/^# \?//' | head -n -1
  exit 0
}

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --source)  SOURCE="$2"; shift 2 ;;
    --target)  TARGET_DIR="$2"; shift 2 ;;
    --targets) TARGETS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --watch)   WATCH=true; shift ;;
    --force)   FORCE=true; shift ;;
    --init)    INIT=true; shift ;;
    -h|--help) usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

# --init: create starter .ai-rules
create_starter() {
  local dest="${TARGET_DIR}/${SOURCE}"
  if [[ -f "$dest" ]] && [[ "$FORCE" != true ]]; then
    error "$dest already exists. Use --force to overwrite."
    exit 1
  fi

  cat > "$dest" << 'STARTER'
# .ai-rules — Single source of truth for all AI coding agents
# Edit this file, then run: ./scripts/rule-sync.sh
# It syncs to CLAUDE.md, .cursor/rules, .codex/instructions.md, etc.

# Project basics
project: my-app
description: A brief description of what this project does
tech_stack: TypeScript, React, Next.js, Tailwind CSS

# Code style
style:
  - Use functional components with arrow functions
  - Prefer named exports over default exports
  - Use TypeScript strict mode — no `any` types
  - Keep files under 300 lines; split when larger
  - Use early returns to reduce nesting

# Architecture rules
architecture:
  - app/ directory uses Next.js App Router conventions
  - Components go in src/components/, grouped by feature
  - Shared utilities in src/lib/
  - API routes in app/api/
  - Database queries in src/db/

# Testing
testing:
  - Write tests for business logic and API routes
  - Use Vitest for unit tests
  - Test file goes next to source file: foo.test.ts

# Git conventions
git:
  - Use conventional commits (feat:, fix:, docs:, etc.)
  - Keep commits small and focused
  - Branch from main, PR back to main

# Commands
commands:
  dev: npm run dev
  build: npm run build
  test: npm run test
  lint: npm run lint

# Custom instructions (freeform, appended as-is)
custom: |
  When making changes, always run the test suite before considering the task done.
  If you're unsure about a design decision, add a TODO comment and move on.
STARTER

  info "Created $dest — edit it and run rule-sync.sh to generate agent configs"
}

if [[ "$INIT" == true ]]; then
  create_starter
  exit 0
fi

# Validate source exists
if [[ ! -f "${TARGET_DIR}/${SOURCE}" ]]; then
  error "Source file not found: ${TARGET_DIR}/${SOURCE}"
  echo "  Run with --init to create a starter .ai-rules file"
  exit 1
fi

# Simple YAML-ish parser (no dependency needed)
# Reads our specific .ai-rules format
parse_rules() {
  local file="$1"
  
  # Extract simple key: value pairs
  PROJECT=$(grep '^project:' "$file" | sed 's/^project:\s*//' | head -1)
  DESCRIPTION=$(grep '^description:' "$file" | sed 's/^description:\s*//' | head -1)
  TECH_STACK=$(grep '^tech_stack:' "$file" | sed 's/^tech_stack:\s*//' | head -1)
  
  # Extract list sections
  extract_list() {
    local section="$1"
    local in_section=false
    while IFS= read -r line; do
      if [[ "$line" =~ ^${section}: ]]; then
        in_section=true
        continue
      fi
      if [[ "$in_section" == true ]]; then
        if [[ "$line" =~ ^[[:space:]]*-[[:space:]] ]]; then
          echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//'
        elif [[ "$line" =~ ^[a-z_]+: ]] || [[ -z "$line" ]]; then
          in_section=false
        fi
      fi
    done < "$file"
  }
  
  # Extract commands (key: value under commands:)
  extract_commands() {
    local in_section=false
    while IFS= read -r line; do
      if [[ "$line" == "commands:" ]]; then
        in_section=true
        continue
      fi
      if [[ "$in_section" == true ]]; then
        if [[ "$line" =~ ^[[:space:]]+([a-z_]+):[[:space:]]*(.*) ]]; then
          echo "${BASH_REMATCH[1]}|${BASH_REMATCH[2]}"
        elif [[ "$line" =~ ^[a-z_]+: ]] || [[ -z "$line" ]]; then
          in_section=false
        fi
      fi
    done < "$file"
  }
  
  # Extract custom block
  extract_custom() {
    local in_section=false
    while IFS= read -r line; do
      if [[ "$line" =~ ^custom:[[:space:]]*\| ]]; then
        in_section=true
        continue
      fi
      if [[ "$in_section" == true ]]; then
        if [[ "$line" =~ ^[[:space:]] ]]; then
          echo "$line" | sed 's/^  //'
        else
          break
        fi
      fi
    done < "$file"
  }
  
  STYLE_RULES=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && STYLE_RULES+=("$line")
  done < <(extract_list "style")
  
  ARCH_RULES=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && ARCH_RULES+=("$line")
  done < <(extract_list "architecture")
  
  TESTING_RULES=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && TESTING_RULES+=("$line")
  done < <(extract_list "testing")
  
  GIT_RULES=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && GIT_RULES+=("$line")
  done < <(extract_list "git")
  
  COMMANDS=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && COMMANDS+=("$line")
  done < <(extract_commands)
  
  CUSTOM=""
  CUSTOM=$(extract_custom)
}

# Generate CLAUDE.md format
gen_claude() {
  local out=""
  out+="# CLAUDE.md\n\n"
  [[ -n "$DESCRIPTION" ]] && out+="$DESCRIPTION\n\n"
  [[ -n "$TECH_STACK" ]] && out+="## Tech Stack\n\n$TECH_STACK\n\n"
  
  if [[ ${#STYLE_RULES[@]} -gt 0 ]]; then
    out+="## Code Style\n\n"
    for rule in "${STYLE_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#ARCH_RULES[@]} -gt 0 ]]; then
    out+="## Architecture\n\n"
    for rule in "${ARCH_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#TESTING_RULES[@]} -gt 0 ]]; then
    out+="## Testing\n\n"
    for rule in "${TESTING_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#GIT_RULES[@]} -gt 0 ]]; then
    out+="## Git Conventions\n\n"
    for rule in "${GIT_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#COMMANDS[@]} -gt 0 ]]; then
    out+="## Commands\n\n"
    for cmd in "${COMMANDS[@]}"; do
      local name="${cmd%%|*}"
      local val="${cmd#*|}"
      out+="- **$name**: \`$val\`\n"
    done
    out+="\n"
  fi
  
  if [[ -n "$CUSTOM" ]]; then
    out+="## Additional Instructions\n\n$CUSTOM\n"
  fi
  
  echo -e "$out"
}

# Generate .cursor/rules format
gen_cursor() {
  local out=""
  [[ -n "$DESCRIPTION" ]] && out+="$DESCRIPTION\n\n"
  [[ -n "$TECH_STACK" ]] && out+="Tech stack: $TECH_STACK\n\n"
  
  if [[ ${#STYLE_RULES[@]} -gt 0 ]]; then
    out+="Code Style:\n"
    for rule in "${STYLE_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#ARCH_RULES[@]} -gt 0 ]]; then
    out+="Architecture:\n"
    for rule in "${ARCH_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#TESTING_RULES[@]} -gt 0 ]]; then
    out+="Testing:\n"
    for rule in "${TESTING_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#GIT_RULES[@]} -gt 0 ]]; then
    out+="Git:\n"
    for rule in "${GIT_RULES[@]}"; do
      out+="- $rule\n"
    done
    out+="\n"
  fi
  
  if [[ ${#COMMANDS[@]} -gt 0 ]]; then
    out+="Commands:\n"
    for cmd in "${COMMANDS[@]}"; do
      local name="${cmd%%|*}"
      local val="${cmd#*|}"
      out+="- $name: $val\n"
    done
    out+="\n"
  fi
  
  if [[ -n "$CUSTOM" ]]; then
    out+="$CUSTOM\n"
  fi
  
  echo -e "$out"
}

# Generate .codex/instructions.md format
gen_codex() {
  # Codex uses markdown similar to Claude
  gen_claude | sed 's/^# CLAUDE.md/# Codex Instructions/'
}

# Generate .windsurfrules format (plain text, similar to cursor)
gen_windsurf() {
  gen_cursor
}

# Generate AGENTS.md (GitHub Copilot Workspace format)
gen_agents() {
  local out=""
  out+="# AGENTS.md\n\n"
  [[ -n "$DESCRIPTION" ]] && out+="$DESCRIPTION\n\n"
  [[ -n "$TECH_STACK" ]] && out+="## Tech Stack\n\n$TECH_STACK\n\n"
  
  if [[ ${#STYLE_RULES[@]} -gt 0 ]] || [[ ${#ARCH_RULES[@]} -gt 0 ]]; then
    out+="## Coding Guidelines\n\n"
    for rule in "${STYLE_RULES[@]}"; do out+="- $rule\n"; done
    for rule in "${ARCH_RULES[@]}"; do out+="- $rule\n"; done
    out+="\n"
  fi
  
  if [[ ${#COMMANDS[@]} -gt 0 ]]; then
    out+="## Commands\n\n"
    for cmd in "${COMMANDS[@]}"; do
      local name="${cmd%%|*}"
      local val="${cmd#*|}"
      out+="- **$name**: \`$val\`\n"
    done
    out+="\n"
  fi
  
  if [[ -n "$CUSTOM" ]]; then
    out+="## Notes\n\n$CUSTOM\n"
  fi
  
  echo -e "$out"
}

# Write a file (respecting --dry-run and --force)
write_file() {
  local dest="$1"
  local content="$2"
  local label="$3"
  
  if [[ "$DRY_RUN" == true ]]; then
    dry "Would write $dest ($label)"
    return
  fi
  
  # Create parent dir if needed
  local dir
  dir=$(dirname "$dest")
  [[ ! -d "$dir" ]] && mkdir -p "$dir"
  
  if [[ -f "$dest" ]] && [[ "$FORCE" != true ]]; then
    # Check if content is identical
    local existing
    existing=$(cat "$dest")
    if [[ "$existing" == "$content" ]]; then
      info "$dest — already up to date"
      return
    fi
    warn "$dest exists and differs. Use --force to overwrite. Skipping."
    return
  fi
  
  echo "$content" > "$dest"
  info "$dest — synced ($label)"
}

# Main sync
do_sync() {
  local src="${TARGET_DIR}/${SOURCE}"
  parse_rules "$src"
  
  echo -e "${BOLD}rule-sync v${VERSION}${NC} — syncing from ${CYAN}${src}${NC}"
  echo ""
  
  IFS=',' read -ra target_list <<< "$TARGETS"
  
  for t in "${target_list[@]}"; do
    case "$t" in
      claude)
        local content
        content=$(gen_claude)
        write_file "${TARGET_DIR}/CLAUDE.md" "$content" "Claude Code"
        ;;
      cursor)
        content=$(gen_cursor)
        # .cursor/rules is the modern location; also write .cursorrules for compat
        write_file "${TARGET_DIR}/.cursor/rules" "$content" "Cursor IDE"
        ;;
      codex)
        content=$(gen_codex)
        write_file "${TARGET_DIR}/.codex/instructions.md" "$content" "OpenAI Codex"
        ;;
      windsurf)
        content=$(gen_windsurf)
        write_file "${TARGET_DIR}/.windsurfrules" "$content" "Windsurf IDE"
        ;;
      agents)
        content=$(gen_agents)
        write_file "${TARGET_DIR}/AGENTS.md" "$content" "Copilot/Agents"
        ;;
      *)
        warn "Unknown target: $t (valid: claude,cursor,codex,windsurf,agents)"
        ;;
    esac
  done
  
  echo ""
  info "Done! Your AI coding agents are in sync."
}

# Watch mode
do_watch() {
  local src="${TARGET_DIR}/${SOURCE}"
  info "Watching $src for changes... (Ctrl+C to stop)"
  
  if command -v inotifywait &>/dev/null; then
    while true; do
      inotifywait -q -e modify "$src" >/dev/null 2>&1
      echo ""
      do_sync
    done
  elif command -v fswatch &>/dev/null; then
    fswatch -o "$src" | while read -r; do
      echo ""
      do_sync
    done
  else
    warn "Neither inotifywait nor fswatch found. Falling back to polling (2s)."
    local last_mod
    last_mod=$(stat -c %Y "$src" 2>/dev/null || stat -f %m "$src" 2>/dev/null)
    while true; do
      sleep 2
      local current_mod
      current_mod=$(stat -c %Y "$src" 2>/dev/null || stat -f %m "$src" 2>/dev/null)
      if [[ "$current_mod" != "$last_mod" ]]; then
        last_mod="$current_mod"
        echo ""
        do_sync
      fi
    done
  fi
}

# Run
do_sync

if [[ "$WATCH" == true ]]; then
  do_watch
fi
