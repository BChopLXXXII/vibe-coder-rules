export const GENERATED_HEADER = "# Auto-synced from AGENTS.md by claw-rules-broadcast — do not edit directly";

export type TargetKind = "claude" | "cursor" | "codex" | "openai";

export type TargetStatus = "in-sync" | "stale" | "conflict" | "missing";

export interface BroadcastTarget {
  kind: TargetKind;
  path: string;
  enabled: boolean;
}

export interface BroadcastConfig {
  sourcePath: string;
  targets: BroadcastTarget[];
}

export interface DiffLine {
  type: "context" | "add" | "remove";
  line: string;
}

export interface TargetReport {
  kind: TargetKind;
  path: string;
  enabled: boolean;
  exists: boolean;
  status: TargetStatus;
  message: string;
  diff?: DiffLine[];
}

export interface SyncEvent {
  id: string;
  at: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface StatusResponse {
  sourcePath: string;
  sourceExists: boolean;
  targets: TargetReport[];
  events: SyncEvent[];
}

export interface SyncResponse extends StatusResponse {
  written: string[];
  skipped: string[];
}
