# env-guardian

> One command to validate all your env vars before you deploy. Never crash on startup because of a missing API key again.

## Who is this for?

**"Multi-Project Maya"** — solo founders running 3+ Next.js projects on Vercel who constantly copy configs between projects and lose track of what's required.

If you've ever deployed to Vercel only to watch it crash because `STRIPE_SECRET_KEY` was missing (or you used the wrong name), this tool is for you.

## Quick Start

```bash
# 1. Install globally
npm install -g env-guardian

# 2. Initialize a schema (pick your stack)
env-guardian init --template nextjs-supabase

# 3. Check your env before deploy
env-guardian check
```

That's it. Now your deploys won't fail because of missing env vars.

## Commands

### `env-guardian init`

Create a `.env.schema.json` file from a template:

```bash
env-guardian init --template nextjs
env-guardian init --template nextjs-supabase
env-guardian init --template stripe
env-guardian init --template resend
env-guardian init --template openai
```

Available templates:
- `nextjs` — Basic Next.js vars
- `nextjs-supabase` — Next.js + Supabase
- `stripe` — Stripe payment keys
- `resend` — Resend email API
- `openai` — OpenAI API keys

### `env-guardian check`

Validate your `.env` against the schema:

```bash
env-guardian check
```

Pass/fail output:
```
✓ Present:
  ✓ NEXT_PUBLIC_SUPABASE_URL
  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY

✗ Missing required:
  ✗ SUPABASE_SERVICE_ROLE_KEY

❌ FAILED: 1 required var(s) missing
```

### `env-guardian templates`

List all available templates and their required vars.

## Workflow

```bash
# In your project directory
$ env-guardian init --template nextjs-supabase
✓ Created .env.schema.json
  Required vars: 4

# Add vars to your .env (forgot one)
$ env-guardian check
❌ FAILED: SUPABASE_SERVICE_ROLE_KEY missing

# Add the missing var
$ echo "SUPABASE_SERVICE_ROLE_KEY=xxx" >> .env

# Check again
$ env-guardian check
✅ PASSED: All required vars present

# Now deploy!
vercel deploy --prod
```

## CI/CD Integration

Add to your Vercel deploy hook or GitHub Actions:

```yaml
- name: Check env vars
  run: npx env-guardian check
```

## Monetization

- **Free:** CLI for individual devs
- **Paid:** GitHub Action for teams ($9/mo) — auto-fail builds on missing vars

---

## License

MIT.

## About

Made by [@BChopLXXXII](https://x.com/BChopLXXXII)

Ship it. 🚀

---

If this helped, [star the repo](https://github.com/BChopLXXXII/env-guardian) — it helps others find it.
