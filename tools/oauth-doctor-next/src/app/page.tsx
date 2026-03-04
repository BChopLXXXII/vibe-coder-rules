"use client";

import { useEffect, useMemo, useState } from "react";

type Finding = {
  level: "error" | "warn" | "pass";
  title: string;
  fix: string;
};

const REQUIRED_KEYS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_ID",
  "GITHUB_SECRET",
];

const SAMPLE_ENV = `NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
GOOGLE_CLIENT_ID=google-id
GOOGLE_CLIENT_SECRET=google-secret
GITHUB_ID=github-id
GITHUB_SECRET=github-secret`;

const BROKEN_ENV = `NEXTAUTH_URL=myapp.com
GOOGLE_CLIENT_ID=google-id`;

function parseEnv(input: string) {
  const lines = input.split("\n");
  const out: Record<string, string> = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, "");
    out[key] = value;
  }

  return out;
}

function checkOAuth(envMap: Record<string, string>): Finding[] {
  const findings: Finding[] = [];

  for (const key of REQUIRED_KEYS) {
    if (!envMap[key]) {
      findings.push({
        level: "error",
        title: `Missing ${key}`,
        fix: `Add ${key} to your .env.local file.`,
      });
    }
  }

  const base = envMap.NEXTAUTH_URL;
  if (base) {
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      findings.push({
        level: "error",
        title: "NEXTAUTH_URL must include protocol",
        fix: "Use full URL, e.g. http://localhost:3000 or https://yourapp.com",
      });
    }

    if (base.includes("localhost") && !base.includes(":3000")) {
      findings.push({
        level: "warn",
        title: "Localhost URL usually needs :3000",
        fix: "Set NEXTAUTH_URL=http://localhost:3000 for local dev.",
      });
    }

    if (base.startsWith("http://") && !base.includes("localhost")) {
      findings.push({
        level: "warn",
        title: "Production URL should use HTTPS",
        fix: "Set NEXTAUTH_URL to https://your-domain.com in production.",
      });
    }
  }

  if (!findings.length) {
    findings.push({
      level: "pass",
      title: "No obvious OAuth config issues found",
      fix: "Run a real provider login test next.",
    });
  }

  return findings;
}

const badgeStyles: Record<Finding["level"], string> = {
  error: "bg-red-100 text-red-800 border-red-200",
  warn: "bg-amber-100 text-amber-800 border-amber-200",
  pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function Home() {
  const [envText, setEnvText] = useState(SAMPLE_ENV);
  const [runCheck, setRunCheck] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "broken") {
      setEnvText(BROKEN_ENV);
      setRunCheck(true);
    }
  }, []);

  const findings = useMemo(() => {
    if (!runCheck) return [];
    return checkOAuth(parseEnv(envText));
  }, [envText, runCheck]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">launch-week liam tool</p>
          <h1 className="mt-2 text-3xl font-semibold">OAuth Doctor for Next.js</h1>
          <p className="mt-2 text-slate-300">
            Paste your <code>.env.local</code> and catch callback/state/redirect mistakes before you waste another night.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Your env config</h2>
              <button
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
                onClick={() => {
                  setEnvText(SAMPLE_ENV);
                  setRunCheck(false);
                }}
              >
                Reset sample
              </button>
            </div>

            <textarea
              className="h-80 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-sm outline-none focus:border-sky-500"
              value={envText}
              onChange={(e) => {
                setRunCheck(false);
                setEnvText(e.target.value);
              }}
            />

            <button
              className="mt-3 w-full rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
              onClick={() => setRunCheck(true)}
            >
              Run OAuth Preflight
            </button>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="mb-3 font-medium">Findings ({findings.length})</h2>
            <div className="space-y-3">
              {findings.map((f, i) => (
                <article key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeStyles[f.level]}`}>
                    {f.level.toUpperCase()}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{f.fix}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
