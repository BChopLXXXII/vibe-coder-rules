# oauth-doctor-next

Catch OAuth callback/state/redirect mistakes in your Next.js setup before you burn another night debugging login.

## Who is this for?

**Launch-Week Liam**: first-time SaaS founders using Next.js + Auth.js/Supabase + Google/GitHub login who keep getting redirect/state mismatch errors.

## What it does (v1)

- Paste your `.env.local`
- Run a preflight check
- Get clear **ERROR/WARN/PASS** findings with copy-paste fixes
- Detects common issues like:
  - missing required env vars
  - bad `NEXTAUTH_URL` format
  - localhost/prod URL mismatch

## Quick Start (under 2 minutes)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and paste your env config.

### Demo mode (shows failing setup)

```bash
http://localhost:3000/?demo=broken
```

## Tech Stack

- Next.js 16
- React + TypeScript
- Tailwind CSS

## Monetization Angle

- Free: local preflight checker (this)
- Premium direction: provider-specific deep checks + deploy-env diff checker + CI preflight gate
- Suggested pricing: $39 one-time starter tool or $12/mo expanded hosted checker

## Notes

This is a focused v1 for common NextAuth/Auth.js + social login setup mistakes. It is a fast preflight, not a full auth runtime debugger.
