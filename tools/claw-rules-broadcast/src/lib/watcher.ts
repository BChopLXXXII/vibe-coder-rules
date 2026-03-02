import { watch } from "node:fs";
import { loadConfig } from "./config";
import { runSync } from "./sync-engine";

export function startWatchMode(): void {
  const config = loadConfig();

  console.log(`[watch] source: ${config.sourcePath}`);
  console.log("[watch] initial sync...");
  const first = runSync(config);
  console.log(`[watch] wrote: ${first.written.length}, skipped: ${first.skipped.length}`);

  let timeout: NodeJS.Timeout | undefined;

  watch(config.sourcePath, () => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      console.log("[watch] change detected, syncing...");
      const result = runSync(config);
      console.log(`[watch] wrote: ${result.written.length}, skipped: ${result.skipped.length}`);
    }, 150);
  });

  console.log("[watch] listening for changes (Ctrl+C to stop)");
}

if (process.argv.includes("--watch")) {
  startWatchMode();
}
