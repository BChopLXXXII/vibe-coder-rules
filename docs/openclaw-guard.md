# openclaw guard (v1)

`openclaw-guard` is a local pre-commit guardrail for AI-generated code risks.

It scans **staged changes only** (`git diff --staged`) and blocks commit (`exit 1`) when high-signal issues are found.

---

## What v1 checks

1. **Ghost/hallucinated local imports**
   - Flags `import`/`require` paths that point to missing local files.
2. **Secrets patterns**
   - Flags common API key/token/private key patterns in added lines.
3. **TODO/FIXME bombs**
   - Flags staged additions containing TODO/FIXME/XXX/HACK markers.
4. **Invented/unresolved import symbols (best effort)**
   - For named local imports (`import { A } from './x'`), checks if `A` appears exported in target module.
   - Also flags unresolved stubs like `throw new Error("Not implemented")`, `@ts-ignore`, and `eslint-disable`.

> v1 is intentionally conservative: reliable static checks over broad/fragile claims.

---

## Usage

```bash
./tools/openclaw-guard.sh
```

### Typical flow

```bash
git add .
./tools/openclaw-guard.sh
# if pass:
git commit -m "your message"
```

### Git hook (optional)

```bash
cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
./tools/openclaw-guard.sh
HOOK
chmod +x .git/hooks/pre-commit
```

---

## Example output

### Pass

```text
openclaw guard — staged diff scan

✔ Guard passed: no risky patterns in staged diff.
```

### Fail

```text
openclaw guard — staged diff scan

[SECRETS]
  - const API_KEY="sk-abc123..."

[GHOST IMPORTS]
  - src/app.ts: ./utils/missing-file

[UNRESOLVED SYMBOLS/STUBS]
  - src/app.ts: makeMoneyFast not exported by src/utils/helpers.ts

✖ Guard failed: 3 finding(s). Fix before commit.
```

---

## Notes / limits (v1)

- Symbol export detection is **best effort** for common JS/TS export patterns.
- Import resolution is focused on local relative paths (`./` and `../`).
- Secrets scan is regex-based, not entropy-based.
- The script reads staged snapshots from git index where possible.

These tradeoffs keep v1 fast, dependency-free, and predictable.
