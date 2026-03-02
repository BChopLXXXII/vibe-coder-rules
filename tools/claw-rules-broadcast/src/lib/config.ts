import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BroadcastConfig, BroadcastTarget } from "./types";

const CONFIG_FILE_NAME = "broadcast-config.json";
const DEFAULT_SOURCE = "/home/openclaw/.openclaw/workspace/AGENTS.md";

function uniqueTargets(targets: BroadcastTarget[]): BroadcastTarget[] {
  const map = new Map<string, BroadcastTarget>();
  for (const target of targets) {
    map.set(resolve(target.path), {
      ...target,
      path: resolve(target.path),
      enabled: target.enabled !== false,
    });
  }
  return Array.from(map.values());
}

function defaultTargets(sourcePath: string): BroadcastTarget[] {
  const baseDir = dirname(sourcePath);
  const targets: BroadcastTarget[] = [
    { kind: "claude", path: resolve(baseDir, "CLAUDE.md"), enabled: true },
    { kind: "cursor", path: resolve(baseDir, ".cursorrules"), enabled: true },
  ];

  const codexPath = resolve(baseDir, "codex.yaml");
  const openaiPath = resolve(baseDir, "openai.yaml");

  if (existsSync(codexPath)) {
    targets.push({ kind: "codex", path: codexPath, enabled: true });
  } else if (existsSync(openaiPath)) {
    targets.push({ kind: "openai", path: openaiPath, enabled: true });
  }

  return targets;
}

export function getConfigPath(): string {
  return resolve(process.cwd(), CONFIG_FILE_NAME);
}

export function getDefaultConfig(): BroadcastConfig {
  return {
    sourcePath: resolve(DEFAULT_SOURCE),
    targets: defaultTargets(resolve(DEFAULT_SOURCE)),
  };
}

export function loadConfig(): BroadcastConfig {
  const configPath = getConfigPath();
  const defaults = getDefaultConfig();

  if (!existsSync(configPath)) {
    return defaults;
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8")) as Partial<BroadcastConfig>;
    const sourcePath = resolve(raw.sourcePath ?? defaults.sourcePath);
    const fallbackTargets = defaultTargets(sourcePath);
    const targets = uniqueTargets(
      (raw.targets?.length ? raw.targets : fallbackTargets).map((target) => ({
        kind: target.kind,
        path: resolve(target.path),
        enabled: target.enabled !== false,
      })),
    );

    return {
      sourcePath,
      targets,
    };
  } catch {
    return defaults;
  }
}

export function saveConfig(input: Partial<BroadcastConfig>): BroadcastConfig {
  const current = loadConfig();
  const sourcePath = resolve(input.sourcePath ?? current.sourcePath);
  const targets = uniqueTargets(input.targets ?? current.targets);
  const next: BroadcastConfig = { sourcePath, targets };

  writeFileSync(getConfigPath(), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
