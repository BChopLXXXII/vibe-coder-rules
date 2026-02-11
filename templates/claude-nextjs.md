# CLAUDE.md — Next.js Template
# Lines: ~80 | For: Next.js + React projects | Level: Beginner

# ============================================
# PROJECT OVERVIEW
# ============================================

Project: [YOUR PROJECT NAME]
Description: [What does this app do?]
Stack: Next.js 14+, React, TypeScript, Tailwind CSS
Deployment: Vercel

# ============================================
# NEXT.JS SPECIFICS
# ============================================

## App Router (Next.js 14+)
- Use App Router (`src/app/`), not Pages Router
- Server Components by default
- Add `'use client'` only when needed (hooks, events, browser APIs)

## File Conventions
- `page.tsx` — route page
- `layout.tsx` — shared layout
- `loading.tsx` — loading UI
- `error.tsx` — error boundary
- `not-found.tsx` — 404 page

# ============================================
# FOLDER STRUCTURE
# ============================================

```
src/
├── app/              # Routes and pages
│   ├── page.tsx      # Home page
│   ├── layout.tsx    # Root layout
│   └── [feature]/    # Feature routes
├── components/       # Reusable components
│   ├── ui/          # Basic UI (buttons, inputs)
│   └── features/    # Feature-specific components
├── lib/             # Utilities and helpers
├── hooks/           # Custom React hooks
└── types/           # TypeScript types
```

# ============================================
# CODING PATTERNS
# ============================================

## Components
- One component per file
- PascalCase for component names
- Props interface above component

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

## Server vs Client
- Fetch data in Server Components
- Use Client Components for interactivity
- Never mix server-only code in client components

# ============================================
# STYLING
# ============================================

- Use Tailwind CSS for all styling
- No inline styles
- Use `cn()` helper for conditional classes (from `lib/utils`)

# ============================================
# DO / DON'T
# ============================================

DO:
- Use Next.js Image component for images
- Use Next.js Link for navigation
- Handle loading and error states

DON'T:
- Use `<img>` tags directly
- Use `<a>` tags for internal links
- Ignore TypeScript errors

# ============================================
# COMMANDS
# ============================================

```bash
npm run dev       # Dev server at localhost:3000
npm run build     # Production build
npm run start     # Run production build
npx vercel        # Deploy to Vercel
```
