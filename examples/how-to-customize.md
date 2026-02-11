# How to Customize Your Rules

You've copied a template. Now what?

## Step 1: Fill in the Basics

Every template has placeholders like `[YOUR PROJECT NAME]`. Replace these with your actual info:

```markdown
# Before
Project: [YOUR PROJECT NAME]
Stack: [e.g., Next.js, React, TypeScript]

# After  
Project: TaskMaster
Stack: Next.js 14, React, TypeScript, Tailwind, Supabase
```

## Step 2: Add Your Folder Structure

If your project structure is different from the template, update it:

```markdown
# If you use a different structure
Components: app/components/       # instead of src/components/
Utilities: app/utils/            # instead of src/lib/
```

## Step 3: Add Project-Specific Rules

As you code, you'll discover things the AI gets wrong. Add rules to fix them:

```markdown
# Example: AI keeps using the wrong import
DO:
- Import Button from '@/components/ui/button'  # shadcn
- NOT from 'react-bootstrap' or 'antd'
```

## Step 4: Keep It Short

If your rules file is getting long, you're probably over-engineering it.

**Signs you have too many rules:**
- File is over 150 lines
- Rules contradict each other
- You can't remember what's in there

**What to do:**
- Remove rules the AI already follows naturally
- Combine similar rules
- Delete rules you've never needed

## Step 5: Evolve Over Time

Your first rules file won't be perfect. That's fine.

Good workflow:
1. Start with minimal template
2. Use AI to code something
3. When AI does something wrong, add a rule
4. Repeat

Bad workflow:
1. Spend 2 hours writing the "perfect" rules file
2. Never update it
3. Wonder why AI still makes mistakes

---

## Common Customizations

### For Monorepos

```markdown
# Monorepo structure
This is a monorepo with:
- apps/web — Next.js frontend
- apps/api — Express backend  
- packages/shared — Shared types and utils

When working on web, only modify files in apps/web.
When working on api, only modify files in apps/api.
Import shared code from @repo/shared.
```

### For Specific Libraries

```markdown
# We use shadcn/ui
- Use components from @/components/ui/
- Follow shadcn patterns for new components
- Use cn() helper for className merging

# We use React Query
- Use useQuery for data fetching
- Use useMutation for data changes
- Cache keys follow pattern: ['resource', id]
```

### For Team Conventions

```markdown
# Our conventions
- Branch names: feature/description or fix/description
- Commit format: type: description (feat:, fix:, docs:, etc.)
- PR titles should match commit format
```

---

## Template: Custom Section

Copy this to add your own section to any template:

```markdown
# ============================================
# [SECTION NAME]
# ============================================

[Your rules here]
```

Keep each section focused on ONE thing.
