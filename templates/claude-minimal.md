# CLAUDE.md — Minimal Template
# Lines: ~50 | For: Any project | Level: Beginner

# ============================================
# WHAT IS THIS FILE?
# ============================================
# This file tells AI coding tools (Claude Code, Cursor, etc.) how to work
# with YOUR project. Think of it as a cheat sheet for your AI assistant.
#
# The AI reads this before helping you, so it knows your preferences.

# ============================================
# PROJECT BASICS
# ============================================
# Tell the AI what this project is. Be specific.

Project: [YOUR PROJECT NAME]
Description: [One sentence about what it does]
Tech Stack: [e.g., Next.js, React, TypeScript, Tailwind]

# ============================================
# CODING STYLE
# ============================================
# How should the AI write code for you?

- Use TypeScript (strict mode)
- Prefer functional components over classes
- Use arrow functions for components
- Keep files under 200 lines — split if longer
- Use descriptive variable names (no single letters except loops)

# ============================================
# FILE STRUCTURE
# ============================================
# Where does stuff go?

- Components: `src/components/`
- Pages/Routes: `src/app/` or `src/pages/`
- Utilities: `src/lib/`
- Types: `src/types/`

# ============================================
# DO / DON'T
# ============================================

DO:
- Ask before deleting files
- Add comments for complex logic
- Use existing patterns from the codebase

DON'T:
- Install new packages without asking
- Refactor unrelated code
- Make changes outside the requested scope

# ============================================
# COMMON COMMANDS
# ============================================

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Check for errors
```

# That's it. Keep it simple.
