# CLAUDE.md — Full-Stack Template
# Lines: ~90 | For: Full-stack apps | Level: Beginner

# ============================================
# PROJECT OVERVIEW
# ============================================

Project: [YOUR APP NAME]
Description: [What does this app do?]
Frontend: Next.js 14+, React, TypeScript, Tailwind
Backend: [Supabase / API Routes / Express]
Database: [Supabase PostgreSQL / Other]
Auth: [Supabase Auth / NextAuth / Clerk]

# ============================================
# ARCHITECTURE
# ============================================

## Frontend → Backend Flow
1. User interacts with UI (React component)
2. Component calls API route or server action
3. Backend validates request and checks auth
4. Backend queries database
5. Response flows back to UI

## Where Code Lives
- UI logic → Client Components (`'use client'`)
- Data fetching → Server Components or API routes
- Database queries → Server only (never expose to client)

# ============================================
# FOLDER STRUCTURE
# ============================================

```
src/
├── app/                # Next.js routes
│   ├── api/           # API routes
│   ├── (auth)/        # Auth pages (login, signup)
│   └── (dashboard)/   # Protected pages
├── components/
│   ├── ui/           # Buttons, inputs, cards
│   └── features/     # Feature components
├── lib/
│   ├── db.ts         # Database client
│   ├── auth.ts       # Auth helpers
│   └── utils.ts      # Shared utilities
├── hooks/            # Custom React hooks
└── types/            # TypeScript types
```

# ============================================
# DATABASE PATTERNS
# ============================================

## Supabase
```typescript
import { createClient } from '@/lib/supabase/server';

async function getUser(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}
```

## Always Handle Errors
- Check for errors after every database call
- Return meaningful messages to the UI
- Log errors for debugging

# ============================================
# AUTH PATTERNS
# ============================================

- Check auth on every protected route/action
- Redirect unauthenticated users to login
- Never trust client-side auth checks alone

# ============================================
# DO / DON'T
# ============================================

DO:
- Keep database queries in server code only
- Validate user input on the server
- Use TypeScript types for all data shapes
- Handle loading and error states in UI

DON'T:
- Expose database credentials to client
- Skip auth checks on sensitive operations
- Trust data from client without validation
- Make direct database calls from client components

# ============================================
# COMMANDS
# ============================================

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run db:push   # Push schema changes (if using Prisma)
npm run db:studio # Open database GUI
```

# ============================================
# ENVIRONMENT
# ============================================

Required `.env.local`:
```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env` files. Copy from `.env.example`.
