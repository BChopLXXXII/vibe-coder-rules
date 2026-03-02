import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadConfig } from "./config";
import {
  BroadcastConfig,
  DiffLine,
  GENERATED_HEADER,
  StatusResponse,
  SyncEvent,
  SyncResponse,
  TargetReport,
} from "./types";

const events: SyncEvent[] = [];
const MAX_EVENTS = 40;

function pushEvent(level: SyncEvent["level"], message: string): void {
  events.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    level,
    message,
  });
  if (events.length > MAX_EVENTS) {
    events.splice(MAX_EVENTS);
  }
}

function withHeader(content: string): string {
  return `${GENERATED_HEADER}\n\n${content.trimEnd()}\n`;
}

function stripMarkdownHeaders(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .filter((line) => !line.trim().match(/^#{1,6}\s+/))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractRules(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
    .join("\n")
    .trim();
}

function renderYamlInstructions(existingYaml: string, instructions: string): string {
  const lines = existingYaml.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().startsWith("instructions:"));
  const blockLines = instructions
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `  ${line}`);

  if (start === -1) {
    const body = existingYaml.trimEnd();
    const spacer = body.length ? "\n" : "";
    return `${body}${spacer}instructions: |\n${blockLines.join("\n")}\n`;
  }

  let end = start + 1;
  while (end < lines.length) {
    const current = lines[end];
    if (!current.trim()) {
      end += 1;
      continue;
    }
    if (!current.startsWith(" ") && !current.startsWith("\t")) {
      break;
    }
    end += 1;
  }

  const before = lines.slice(0, start);
  const after = lines.slice(end);

  return `${[...before, `instructions: |`, ...blockLines, ...after].join("\n").trimEnd()}\n`;
}

function buildExpectedOutput(kind: TargetReport["kind"], sourceMarkdown: string, existingTarget?: string): string {
  if (kind === "claude") {
    return withHeader(sourceMarkdown);
  }

  if (kind === "cursor") {
    return withHeader(stripMarkdownHeaders(sourceMarkdown));
  }

  if (kind === "codex" || kind === "openai") {
    const base = existingTarget ?? "";
    const instructionBlock = extractRules(sourceMarkdown);
    const yaml = renderYamlInstructions(base, instructionBlock || "No rules extracted from source.");
    return withHeader(yaml);
  }

  return withHeader(sourceMarkdown);
}

function quickDiff(actual: string, expected: string): DiffLine[] {
  const a = actual.split(/\r?\n/);
  const b = expected.split(/\r?\n/);
  const max = Math.max(a.length, b.length);
  const diff: DiffLine[] = [];

  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];

    if (left === right) {
      if (left !== undefined) {
        diff.push({ type: "context", line: left });
      }
      continue;
    }

    if (left !== undefined) {
      diff.push({ type: "remove", line: left });
    }
    if (right !== undefined) {
      diff.push({ type: "add", line: right });
    }
  }

  return diff.slice(0, 80);
}

function computeReport(config: BroadcastConfig): StatusResponse {
  const sourceExists = existsSync(config.sourcePath);
  const sourceContent = sourceExists ? readFileSync(config.sourcePath, "utf8") : "";

  const targets: TargetReport[] = config.targets.map((target) => {
    const exists = existsSync(target.path);
    const current = exists ? readFileSync(target.path, "utf8") : "";
    const expected = sourceExists
      ? buildExpectedOutput(target.kind, sourceContent, current.replace(`${GENERATED_HEADER}\n\n`, ""))
      : "";

    if (!target.enabled) {
      return {
        kind: target.kind,
        path: target.path,
        enabled: false,
        exists,
        status: "missing",
        message: "Disabled target",
      };
    }

    if (!exists) {
      const yamlTarget = target.kind === "codex" || target.kind === "openai";
      return {
        kind: target.kind,
        path: target.path,
        enabled: true,
        exists: false,
        status: "missing",
        message: yamlTarget
          ? "YAML target missing (won't be created automatically)."
          : "Target file does not exist yet",
      };
    }

    if (!sourceExists) {
      return {
        kind: target.kind,
        path: target.path,
        enabled: true,
        exists,
        status: "conflict",
        message: "Source AGENTS.md not found",
      };
    }

    if (current === expected) {
      return {
        kind: target.kind,
        path: target.path,
        enabled: true,
        exists,
        status: "in-sync",
        message: "Matches generated output",
      };
    }

    if (current.startsWith(GENERATED_HEADER)) {
      return {
        kind: target.kind,
        path: target.path,
        enabled: true,
        exists,
        status: "stale",
        message: "Auto-generated file is stale and can be refreshed",
        diff: quickDiff(current, expected),
      };
    }

    return {
      kind: target.kind,
      path: target.path,
      enabled: true,
      exists,
      status: "conflict",
      message: "Manual edits detected, sync skipped for safety",
      diff: quickDiff(current, expected),
    };
  });

  return {
    sourcePath: config.sourcePath,
    sourceExists,
    targets,
    events,
  };
}

export function getStatus(config?: BroadcastConfig): StatusResponse {
  return computeReport(config ?? loadConfig());
}

export function runSync(config?: BroadcastConfig): SyncResponse {
  const effective = config ?? loadConfig();
  const report = computeReport(effective);
  const written: string[] = [];
  const skipped: string[] = [];

  if (!report.sourceExists) {
    pushEvent("error", `Source file not found: ${report.sourcePath}`);
    return { ...report, written, skipped: effective.targets.map((target) => target.path) };
  }

  const source = readFileSync(effective.sourcePath, "utf8");

  for (const target of report.targets) {
    if (!target.enabled) {
      skipped.push(target.path);
      continue;
    }

    const currentExists = existsSync(target.path);
    const current = currentExists ? readFileSync(target.path, "utf8") : "";
    const existingForYaml = current.startsWith(GENERATED_HEADER)
      ? current.replace(`${GENERATED_HEADER}\n\n`, "")
      : current;
    const expected = buildExpectedOutput(target.kind, source, existingForYaml);

    if (target.status === "conflict") {
      skipped.push(target.path);
      pushEvent("warn", `Conflict detected in ${target.path}. Manual edits preserved.`);
      continue;
    }

    if ((target.kind === "codex" || target.kind === "openai") && !currentExists) {
      skipped.push(target.path);
      pushEvent("warn", `Skipped ${target.path} because YAML file does not exist.`);
      continue;
    }

    writeFileSync(target.path, expected, "utf8");
    written.push(target.path);
    pushEvent("info", `Synced ${target.path}`);
  }

  const updated = computeReport(effective);
  return {
    ...updated,
    written,
    skipped,
  };
}

export function ensureConfigTargetsForSource(config: BroadcastConfig): BroadcastConfig {
  const sourceDir = dirname(config.sourcePath);
  const hasClaude = config.targets.some((target) => resolve(target.path) === resolve(sourceDir, "CLAUDE.md"));
  const hasCursor = config.targets.some((target) => resolve(target.path) === resolve(sourceDir, ".cursorrules"));

  const targets = [...config.targets];
  if (!hasClaude) {
    targets.push({ kind: "claude", path: resolve(sourceDir, "CLAUDE.md"), enabled: true });
  }
  if (!hasCursor) {
    targets.push({ kind: "cursor", path: resolve(sourceDir, ".cursorrules"), enabled: true });
  }

  return { ...config, targets };
}
