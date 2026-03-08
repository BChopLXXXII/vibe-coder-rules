#!/usr/bin/env node
import { Command } from "commander";
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Severity = "high" | "medium" | "low";

type Rule = {
  id: string;
  title: string;
  severity: Severity;
  hint: string;
  pattern: RegExp;
};

type Finding = {
  file: string;
  line: number;
  severity: Severity;
  ruleId: string;
  title: string;
  hint: string;
  excerpt: string;
};

const RULES: Rule[] = [
  { id: "fake-fetch-timeout", title: "Likely hallucinated fetch timeout option", severity: "high", hint: "fetch() ignores timeout; use AbortController.", pattern: /\bfetch\s*\([^\)]*timeout\s*:/ },
  { id: "jwt-localstorage", title: "JWT persisted in localStorage", severity: "high", hint: "Prefer HttpOnly cookies for auth tokens.", pattern: /localStorage\.(setItem|getItem)\([^\)]*(token|jwt)/i },
  { id: "hardcoded-secret", title: "Hardcoded secret-like literal", severity: "high", hint: "Move secrets to environment variables.", pattern: /(api[_-]?key|secret|token|password)\s*[:=]\s*["'`][^"'`]{10,}["'`]/i },
  { id: "mock-api-url", title: "Mock/test endpoint left in code", severity: "medium", hint: "Verify endpoint for production usage.", pattern: /https?:\/\/(localhost|example\.com|jsonplaceholder\.typicode\.com)/i },
  { id: "console-sensitive", title: "Potential sensitive data logged", severity: "medium", hint: "Avoid logging secrets, headers, or auth payloads.", pattern: /console\.(log|error|warn)\([^\)]*(token|secret|authorization|password)/i },
  { id: "any-auth-user", title: "Unsafe any cast around auth/user", severity: "medium", hint: "Use explicit auth types; avoid bypassing checks.", pattern: /\bas\s+any\b[^\n]*(auth|user)|\b(auth|user)[^\n]*\bas\s+any\b/i },
  { id: "dangerously-set-html", title: "dangerouslySetInnerHTML used", severity: "medium", hint: "Sanitize untrusted content before rendering.", pattern: /dangerouslySetInnerHTML\s*=\s*\{/ },
  { id: "eval-usage", title: "eval/new Function detected", severity: "high", hint: "Avoid dynamic code execution.", pattern: /\b(eval\s*\(|new\s+Function\s*\()/ },
  { id: "random-id-db", title: "Random UUID used for sortable DB IDs", severity: "low", hint: "For ordered IDs use ULID/UUIDv7 if query patterns need sortability.", pattern: /crypto\.randomUUID\s*\(/ },
  { id: "ts-ignore", title: "Type safety bypass via ts-ignore", severity: "low", hint: "Resolve type issue before shipping.", pattern: /@ts-ignore/ },
  { id: "auth-disabled", title: "Auth check appears bypassed", severity: "high", hint: "Never leave bypass flags in production code.", pattern: /(skipAuth|disableAuth|authBypass)\s*=\s*true/i },
  { id: "open-cors", title: "Overly permissive CORS", severity: "medium", hint: "Restrict CORS origin in production.", pattern: /Access-Control-Allow-Origin["']?\s*[:=]\s*["']\*["']/i }
];

async function scan(targetDir: string, asJson: boolean): Promise<number> {
  const files = await fg(["**/*.{ts,tsx,js,jsx,mjs,cjs}"], {
    cwd: targetDir,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**", "**/.git/**"]
  });

  const findings: Finding[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      for (const rule of RULES) {
        if (rule.pattern.test(line)) {
          findings.push({
            file: path.relative(process.cwd(), file),
            line: idx + 1,
            severity: rule.severity,
            ruleId: rule.id,
            title: rule.title,
            hint: rule.hint,
            excerpt: line.trim().slice(0, 220)
          });
        }
      }
    });
  }

  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (asJson) {
    process.stdout.write(JSON.stringify({ scannedFiles: files.length, findings }, null, 2) + "\n");
  } else {
    console.log(`claw-guardian scanned ${files.length} files`);
    if (findings.length === 0) {
      console.log("No AI code smells detected. Nice.");
      return 0;
    }

    console.log(`Found ${findings.length} potential issue(s):\n`);
    for (const f of findings) {
      console.log(`[${f.severity.toUpperCase()}] ${f.title}`);
      console.log(`  ${f.file}:${f.line}`);
      console.log(`  ${f.excerpt}`);
      console.log(`  fix: ${f.hint}\n`);
    }
  }

  const hasHigh = findings.some(f => f.severity === "high");
  return hasHigh ? 2 : 1;
}

const program = new Command();
program
  .name("claw-guardian")
  .description("Catch AI-generated code smells before they ship")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a codebase for AI-generated code smells")
  .option("-d, --dir <path>", "directory to scan", ".")
  .option("--json", "output findings as JSON", false)
  .action(async (opts) => {
    const exitCode = await scan(path.resolve(opts.dir), Boolean(opts.json));
    process.exitCode = exitCode;
  });

program.parse();
