# CLAUDE.md — API/Backend Template
# Lines: ~75 | For: Backend/API projects | Level: Beginner

# ============================================
# PROJECT OVERVIEW
# ============================================

Project: [YOUR API NAME]
Description: [What does this API do?]
Stack: [Node.js/Express, Python/FastAPI, etc.]
Database: [PostgreSQL, MongoDB, Supabase, etc.]

# ============================================
# API DESIGN
# ============================================

## REST Conventions
- Use plural nouns: `/users`, `/posts`
- Use HTTP methods correctly:
  - GET = read
  - POST = create
  - PUT/PATCH = update
  - DELETE = remove
- Return appropriate status codes (200, 201, 400, 404, 500)

## Response Format
Always return JSON with consistent structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

# ============================================
# FOLDER STRUCTURE
# ============================================

```
src/
├── routes/          # API route handlers
├── controllers/     # Business logic
├── models/          # Database models
├── middleware/      # Auth, validation, etc.
├── lib/             # Utilities
└── types/           # TypeScript types
```

# ============================================
# CODING PATTERNS
# ============================================

## Error Handling
- Always wrap async routes in try/catch
- Return meaningful error messages
- Log errors for debugging

```typescript
try {
  const result = await doSomething();
  return res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return res.status(500).json({ 
    success: false, 
    error: 'Something went wrong' 
  });
}
```

## Validation
- Validate all inputs before processing
- Use a validation library (zod, yup, joi)
- Return clear validation errors

# ============================================
# SECURITY
# ============================================

- Never commit secrets to git
- Use environment variables for config
- Validate and sanitize all user input
- Use parameterized queries (no raw SQL)
- Add rate limiting to prevent abuse

# ============================================
# DO / DON'T
# ============================================

DO:
- Add input validation to every endpoint
- Use TypeScript types for request/response
- Log important operations

DON'T:
- Expose sensitive data in responses
- Trust client input without validation
- Store passwords in plain text

# ============================================
# COMMANDS
# ============================================

```bash
npm run dev       # Dev server with hot reload
npm run build     # Compile TypeScript
npm run start     # Run production
npm run test      # Run tests
```
