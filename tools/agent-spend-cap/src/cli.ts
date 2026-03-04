#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";

type UsageEvent = {
  timestamp: string;
  tool: string;
  sessionId: string;
  costUsd: number;
  subagent?: string;
};

type Config = {
  budgetUsd: number;
  warnAtPct: number[];
};

const CONFIG_PATH = path.resolve(process.cwd(), ".agent-spend-cap.json");

function readConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}. Run: agent-spend-cap init --budget 25`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Config;
}

function parseEvents(filePath: string): UsageEvent[] {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as UsageEvent);
}

function dollars(v: number): string {
  return `$${v.toFixed(2)}`;
}

const program = new Command();
program
  .name("agent-spend-cap")
  .description("Hard cap + burn-rate alerts for coding-agent sessions")
  .version("0.1.0");

program
  .command("init")
  .description("Create local budget policy file")
  .requiredOption("--budget <usd>", "hard budget in USD")
  .option("--warn <levels>", "comma-separated warn percentages", "50,75,90")
  .action((opts: { budget: string; warn: string }) => {
    const warnAtPct = opts.warn
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0 && x < 100)
      .sort((a, b) => a - b);

    const conf: Config = { budgetUsd: Number(opts.budget), warnAtPct };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(conf, null, 2));
    console.log(`Saved ${CONFIG_PATH}`);
  });

program
  .command("check")
  .description("Check current spend against cap")
  .requiredOption("--log <path>", "NDJSON usage event log")
  .action((opts: { log: string }) => {
    const conf = readConfig();
    const events = parseEvents(path.resolve(process.cwd(), opts.log));
    const total = events.reduce((sum, e) => sum + e.costUsd, 0);
    const pct = conf.budgetUsd === 0 ? 0 : (total / conf.budgetUsd) * 100;

    console.log(`Budget: ${dollars(conf.budgetUsd)}`);
    console.log(`Spend:  ${dollars(total)} (${pct.toFixed(1)}%)`);

    const hit = conf.warnAtPct.filter((w) => pct >= w);
    for (const warn of hit) {
      console.log(`⚠️  Warning: spend crossed ${warn}%`);
    }

    const bySession = new Map<string, number>();
    const bySubagent = new Map<string, number>();
    for (const e of events) {
      bySession.set(e.sessionId, (bySession.get(e.sessionId) ?? 0) + e.costUsd);
      if (e.subagent) {
        bySubagent.set(e.subagent, (bySubagent.get(e.subagent) ?? 0) + e.costUsd);
      }
    }

    console.log("\nSession breakdown:");
    [...bySession.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`- ${k}: ${dollars(v)}`));

    if (bySubagent.size > 0) {
      console.log("\nSub-agent breakdown:");
      [...bySubagent.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`- ${k}: ${dollars(v)}`));
    }

    if (total >= conf.budgetUsd) {
      console.log("\n🛑 HARD CAP HIT: stop spawning new agent sessions.");
      process.exit(2);
    }

    console.log("\n✅ Under cap.");
  });

program.parse();
