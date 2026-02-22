#!/usr/bin/env bash
set -euo pipefail

MODE="balanced" # balanced|strict
ROOT="."

usage() {
  cat <<'EOF'
claw-context-audit

Usage:
  ./tools/claw-context-audit.sh [path] [--strict]
  ./tools/claw-context-audit.sh --strict [path]

Options:
  --strict    Only keep hard rules + blocked behaviors + executable commands
  -h, --help  Show help
EOF
}

for arg in "$@"; do
  case "$arg" in
    --strict) MODE="strict" ;;
    -h|--help) usage; exit 0 ;;
    *) ROOT="$arg" ;;
  esac
done

OUT_DIR="$ROOT/reports"
AUDIT_OUT="$OUT_DIR/context-audit.md"
BRIEF_OUT="$OUT_DIR/run-brief.md"

mkdir -p "$OUT_DIR"

python3 - "$ROOT" "$AUDIT_OUT" "$BRIEF_OUT" "$MODE" <<'PY'
import re, sys, math, hashlib
from pathlib import Path
from collections import Counter, defaultdict

root = Path(sys.argv[1]).resolve()
audit_out = Path(sys.argv[2]).resolve()
brief_out = Path(sys.argv[3]).resolve()
mode = sys.argv[4]

patterns = [
    "AGENTS.md", "CLAUDE.md", ".cursorrules", ".windsurfrules", ".ai-rules",
    ".codex/instructions.md", "README.md", "docs/**/*.md", "tools/**/*.md", "scripts/**/*.md"
]

files = []
seen = set()
for pat in patterns:
    for p in root.glob(pat):
        if p.is_file():
            rp = p.resolve()
            if rp not in seen:
                files.append(rp)
                seen.add(rp)

if not files:
    audit_out.write_text("# Context Audit\n\nNo instruction files found.\n", encoding="utf-8")
    brief_out.write_text("# Run Brief\n\nNo inputs found.\n", encoding="utf-8")
    print(f"Wrote {audit_out} and {brief_out}")
    sys.exit(0)

def est_tokens(s: str) -> int:
    return max(1, math.ceil(len(s) / 4))

def normalize_line(line: str) -> str:
    line = line.strip().lower()
    line = re.sub(r"`[^`]+`", "`x`", line)
    line = re.sub(r"https?://\S+", "url", line)
    line = re.sub(r"\s+", " ", line)
    return line

def is_heading_only(line: str) -> bool:
    s = line.strip()
    if not s.startswith("#"):
        return False
    text = re.sub(r"^#+\s*", "", s).strip().lower()
    generic = {
        "overview", "usage", "examples", "notes", "license", "about",
        "quick start", "options", "output", "requirements", "what it does",
        "how it works", "why", "findings", "summary"
    }
    if text in generic:
        return True
    return len(text.split()) <= 2

def line_priority(line: str, path: str) -> int:
    s = line.strip()
    low = s.lower()
    score = 0

    if re.match(r"^(never|always|must|do not|don't|avoid|use|keep|ask|run|build|test|enforce|refuse|block|fail)\b", low):
        score += 5
    if s.startswith(("- ", "* ")):
        score += 2
    if ("`" in s and ("./" in s or "npm " in s or "openclaw " in s or "git " in s)) or s.startswith(("./", "openclaw ", "git ", "$ ")):
        score += 3
    if any(w in low for w in ["rule", "guard", "lock", "approval", "security", "forbidden", "required", "must", "do not"]):
        score += 2
    if any(w in low for w in ["framework", "styling", "state", "testing", "file structure"]):
        score += 1
    if is_heading_only(s):
        score -= 4
    if any(w in low for w in ["star the repo", "made by", "ship it", "why this exists", "copy-paste ready", "beginner-friendly", "heavily commented"]):
        score -= 4
    if len(s) > 180:
        score -= 2

    return score

rows = []
all_lines = defaultdict(list)

for f in sorted(files):
    text = f.read_text(encoding="utf-8", errors="ignore")
    rel = f.relative_to(root)
    tokens = est_tokens(text)
    lines = text.splitlines()
    words = re.findall(r"[A-Za-z0-9_\-]+", text.lower())
    uniq_words = len(set(words))
    signal_ratio = (uniq_words / max(1, len(words)))

    nlines = [normalize_line(l) for l in lines if normalize_line(l)]
    for nl in nlines:
        all_lines[nl].append(str(rel))

    rows.append({
        "path": str(rel),
        "chars": len(text),
        "tokens": tokens,
        "lines": len(lines),
        "signal_ratio": signal_ratio,
        "text": text,
    })

rows.sort(key=lambda r: r["tokens"], reverse=True)
total_tokens = sum(r["tokens"] for r in rows)
top5 = rows[:5]

shared = []
for line, owners in all_lines.items():
    uniq = sorted(set(owners))
    if len(uniq) >= 2 and len(line) >= 24:
        shared.append((line, uniq))
shared.sort(key=lambda x: len(x[1]), reverse=True)

overlap_count = Counter()
for line, owners in shared:
    for o in set(owners):
        overlap_count[o] += 1
for r in rows:
    r["overlap_lines"] = overlap_count.get(r["path"], 0)

candidates = []
for r in rows:
    path = r["path"]
    for idx, raw in enumerate(r["text"].splitlines(), start=1):
        s = raw.strip()
        if not s:
            continue

        low = s.lower()
        hard_rule = bool(re.search(r"\b(must|required|always|never|do not|don't|refuse|enforce|lock|blocked|forbidden)\b", low))
        blocked_behavior = bool(re.search(r"\b(do not|don't|refuse|blocked|forbidden|non[- ]negotiable)\b", low))
        executable_cmd = (
            s.startswith("$")
            or s.startswith("./")
            or s.startswith("openclaw ")
            or s.startswith("git ")
            or ("`" in s and ("./" in s or "openclaw " in s or "git " in s or "npm " in s))
        )

        # drop orphan numbered fragments (e.g., "3. something") unless they are rule-like
        orphan_numbered_fragment = bool(re.match(r"^\d+\.\s+", s)) and not (hard_rule or blocked_behavior or executable_cmd)
        if orphan_numbered_fragment:
            continue

        concise_bullet = s.startswith(("- ", "* ")) and len(s) <= 160 and (hard_rule or blocked_behavior or executable_cmd)
        heading = s.startswith("#") and not is_heading_only(s)

        promo_noise = any(w in low for w in ["ship it", "star the repo", "made by", "why this exists", "copy-paste ready", "beginner-friendly", "heavily commented"])
        if promo_noise:
            continue

        if mode == "strict":
            keep = hard_rule or blocked_behavior or executable_cmd or concise_bullet
            min_score = 3
        else:
            imperative = bool(re.match(r"^(never|always|must|do not|don't|avoid|use|keep|ask|run|build|test|enforce|refuse|block|fail)\b", low))
            short_bullet = s.startswith(("- ", "* ")) and len(s) <= 160
            keep = hard_rule or blocked_behavior or executable_cmd or concise_bullet or imperative or short_bullet or heading
            min_score = 1

        if not keep:
            continue

        pri = line_priority(s, path)
        if pri < min_score:
            continue

        candidates.append({"line": s, "path": path, "priority": pri, "idx": idx})

best = {}
for c in candidates:
    k = hashlib.sha1(normalize_line(c["line"]).encode()).hexdigest()
    if k not in best or c["priority"] > best[k]["priority"]:
        best[k] = c

selected = list(best.values())
selected.sort(key=lambda x: (-x["priority"], x["path"], x["idx"]))

# final cleanup for strict mode: strip list fragments unless clearly actionable commands/rules
if mode == "strict":
    cleaned = []
    for c in selected:
        s = c["line"].strip()
        low = s.lower()
        if re.match(r"^\d+\.\s+", s):
            has_cmd = ("`" in s and ("./" in s or "npm " in s or "openclaw " in s or "git ")) or s.startswith(("./", "openclaw ", "git ", "$ "))
            has_rule = bool(re.search(r"\b(must|required|always|never|do not|don't|refuse|enforce|forbidden|blocked)\b", low))
            if not (has_cmd or has_rule):
                continue
        cleaned.append(c)
    selected = cleaned

max_lines = 45 if mode == "strict" else 60
brief_lines = [c["line"] for c in selected[:max_lines]]

if mode == "strict":
    filtered_lines = []
    for s in brief_lines:
        low = s.lower().strip()
        if re.match(r"^\d+\.\s+", s.strip()):
            has_cmd = ("`" in s and ("./" in s or "npm " in s or "openclaw " in s or "git ")) or s.strip().startswith(("./", "openclaw ", "git ", "$ "))
            has_rule = bool(re.search(r"\b(must|required|always|never|do not|don't|refuse|enforce|forbidden|blocked)\b", low))
            if not (has_cmd or has_rule):
                continue
        filtered_lines.append(s)
    brief_lines = filtered_lines

brief_text = "\n".join(brief_lines)
if mode == "strict":
    # hard strip numbered list fragments in final text (often contextless markdown leftovers)
    brief_text = "\n".join([ln for ln in brief_text.splitlines() if not re.match(r"^\s*\d+\.\s+", ln)])
brief_tokens = est_tokens(brief_text)

high_cost = [r for r in rows if r["tokens"] >= max(250, total_tokens * 0.15)]
high_overlap = [r for r in rows if r["overlap_lines"] >= 20]
low_signal = [r for r in rows if r["signal_ratio"] < 0.35 and r["tokens"] > 120]

reduction_pct = round((1 - (brief_tokens / total_tokens)) * 100, 1) if total_tokens else 0

md = []
md.append("# Context Audit Report\n")
md.append(f"- Root: `{root}`")
md.append(f"- Mode: **{mode}**")
md.append(f"- Files scanned: **{len(rows)}**")
md.append(f"- Estimated pre-task context: **{total_tokens} tokens**")
md.append(f"- Generated run brief: **{brief_tokens} tokens**")
md.append(f"- Estimated reduction: **{reduction_pct}%**\n")

md.append("## Token Cost by Source\n")
md.append("| File | Est. Tokens | Lines | Overlap Lines | Signal Ratio |")
md.append("|---|---:|---:|---:|---:|")
for r in rows:
    md.append(f"| `{r['path']}` | {r['tokens']} | {r['lines']} | {r['overlap_lines']} | {r['signal_ratio']:.2f} |")

md.append("\n## Top Cost Drivers\n")
for r in top5:
    md.append(f"- `{r['path']}` — {r['tokens']} tokens")

md.append("\n## Findings\n")
if high_cost:
    md.append("### High Cost Sources")
    for r in high_cost:
        md.append(f"- `{r['path']}` is heavy ({r['tokens']} tokens). Consider splitting or moving reference material out of startup context.")
if high_overlap:
    md.append("\n### High Overlap Sources")
    for r in high_overlap:
        md.append(f"- `{r['path']}` repeats content ({r['overlap_lines']} shared lines). Candidate for consolidation.")
if low_signal:
    md.append("\n### Low Signal Sources")
    for r in low_signal:
        md.append(f"- `{r['path']}` has low unique-word ratio ({r['signal_ratio']:.2f}). Tighten repetitive prose.")
if not (high_cost or high_overlap or low_signal):
    md.append("- No major risks flagged by heuristics.")

md.append("\n## Shared Line Samples (Potential Duplication)\n")
for line, owners in shared[:15]:
    owners_txt = ", ".join(f"`{o}`" for o in owners)
    md.append(f"- **{owners_txt}** → {line}")
if not shared:
    md.append("- No repeated long lines across files.")

audit_out.write_text("\n".join(md) + "\n", encoding="utf-8")

brief = []
brief.append("# Run Brief (Compressed)")
brief.append("")
brief.append("Use this as the high-signal context block before coding. Regenerate with `./tools/claw-context-audit.sh`.")
brief.append("")
brief.append(f"- Mode: **{mode}**")
brief.append(f"- Source files: {len(rows)}")
brief.append(f"- Estimated tokens: {brief_tokens} (down from ~{total_tokens}, -{reduction_pct}%)")
brief.append("")
brief.append("## Core Instructions")
brief.append(brief_text if brief_text else "No concise lines detected.")
brief.append("")
brief.append("## Notes")
brief.append("- Heuristic compression only; source files remain canonical policy.")
brief.append("- Re-run after policy changes to avoid drift.")

brief_out.write_text("\n".join(brief) + "\n", encoding="utf-8")

print(f"Wrote {audit_out}")
print(f"Wrote {brief_out}")
print(f"Mode: {mode}")
print(f"Estimated tokens: {total_tokens} -> {brief_tokens} (-{reduction_pct}%)")
PY
