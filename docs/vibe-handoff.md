# vibe-handoff

`vibe-handoff` snapshots your repo state into a `HANDOFF.md` file so the next AI session can pick up fast.

## Why

Pain point: session memory resets and cross-agent handoffs are messy.

## Usage

```bash
# default output: HANDOFF.md in current repo
./tools/vibe-handoff.sh

# print output to terminal too
./tools/vibe-handoff.sh --print

# custom output file
./tools/vibe-handoff.sh --out docs/HANDOFF-TODAY.md

# run against another local repo
./tools/vibe-handoff.sh --root ../my-project --out ../my-project/HANDOFF.md
```

## Output structure

- Goal
- What changed
- Current git state
- Last commit
- Recent commits
- Key files
- Next steps
- Resume prompt

## Notes

- It does **not** commit or push anything.
- It warns if run outside a git repo.
- You should still fill in Goal/What changed/Next steps before ending your session.
