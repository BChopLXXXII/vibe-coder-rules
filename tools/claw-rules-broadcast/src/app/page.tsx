"use client";

import { useEffect, useMemo, useState } from "react";
import { BroadcastConfig, DiffLine, StatusResponse, SyncResponse, TargetReport } from "@/lib/types";

type ApiState = {
  status: StatusResponse | null;
  loading: boolean;
  error: string | null;
};

const STATUS_LABEL: Record<TargetReport["status"], string> = {
  "in-sync": "in-sync ✅",
  stale: "stale ⚠️",
  conflict: "conflict ❌",
  missing: "missing",
};

function DiffView({ diff }: { diff?: DiffLine[] }) {
  if (!diff?.length) return null;

  return (
    <pre className="mt-2 max-h-44 overflow-auto rounded bg-black/50 p-3 text-xs leading-5 text-amber-100">
      {diff.map((line, index) => {
        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
        const color = line.type === "add" ? "text-emerald-300" : line.type === "remove" ? "text-rose-300" : "text-amber-100";
        return (
          <div key={`${prefix}-${index}`} className={color}>
            {prefix} {line.line}
          </div>
        );
      })}
    </pre>
  );
}

export default function Home() {
  const [apiState, setApiState] = useState<ApiState>({ status: null, loading: true, error: null });
  const [config, setConfig] = useState<BroadcastConfig | null>(null);
  const [sourcePathInput, setSourcePathInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setApiState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [statusRes, configRes] = await Promise.all([fetch("/api/status"), fetch("/api/config")]);
      if (!statusRes.ok || !configRes.ok) {
        throw new Error("Failed to load state");
      }
      const statusJson = (await statusRes.json()) as StatusResponse;
      const configJson = (await configRes.json()) as BroadcastConfig;
      setApiState({ status: statusJson, loading: false, error: null });
      setConfig(configJson);
      setSourcePathInput(configJson.sourcePath);
    } catch (error) {
      setApiState({ status: null, loading: false, error: (error as Error).message });
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = (await response.json()) as SyncResponse;
      setApiState({ status: data, loading: false, error: null });
    } catch (error) {
      setApiState((prev) => ({ ...prev, error: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, sourcePath: sourcePathInput }),
      });
      const data = (await response.json()) as BroadcastConfig;
      setConfig(data);
      await loadAll();
    } catch (error) {
      setApiState((prev) => ({ ...prev, error: (error as Error).message }));
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    if (!apiState.status) return null;
    const counts = { ok: 0, stale: 0, conflict: 0, missing: 0 };
    for (const target of apiState.status.targets) {
      if (target.status === "in-sync") counts.ok += 1;
      if (target.status === "stale") counts.stale += 1;
      if (target.status === "conflict") counts.conflict += 1;
      if (target.status === "missing") counts.missing += 1;
    }
    return counts;
  }, [apiState.status]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-amber-300">claw-rules-broadcast</h1>
      <p className="mt-2 text-sm text-amber-100/80">One source of truth for AGENTS.md across Claude, Cursor, and Codex/OpenAI configs.</p>

      <section className="mt-6 rounded-xl border border-amber-900/60 bg-neutral-900/80 p-4">
        <label className="text-sm font-medium text-amber-200">Source file path</label>
        <div className="mt-2 flex flex-col gap-2 md:flex-row">
          <input
            value={sourcePathInput}
            onChange={(event) => setSourcePathInput(event.target.value)}
            className="w-full rounded border border-amber-900 bg-black/40 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="/path/to/AGENTS.md"
          />
          <button
            onClick={saveConfig}
            disabled={saving}
            className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save config"}
          </button>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="rounded border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Manual sync"}
          </button>
        </div>
      </section>

      {summary && (
        <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm">in-sync: {summary.ok}</div>
          <div className="rounded border border-yellow-900/40 bg-yellow-950/20 p-3 text-sm">stale: {summary.stale}</div>
          <div className="rounded border border-rose-900/40 bg-rose-950/20 p-3 text-sm">conflict: {summary.conflict}</div>
          <div className="rounded border border-zinc-700/60 bg-zinc-900/60 p-3 text-sm">missing: {summary.missing}</div>
        </section>
      )}

      {apiState.error && <p className="mt-4 rounded border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">{apiState.error}</p>}

      <section className="mt-6 rounded-xl border border-amber-900/60 bg-neutral-900/80 p-4">
        <h2 className="text-lg font-semibold text-amber-300">Targets</h2>
        {apiState.loading && <p className="mt-2 text-sm text-amber-100/70">Loading...</p>}
        <div className="mt-3 space-y-4">
          {apiState.status?.targets.map((target) => (
            <article key={target.path} className="rounded border border-amber-950/80 bg-black/30 p-3">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <div className="text-sm text-amber-200">{target.kind}</div>
                  <code className="text-xs text-amber-100/80">{target.path}</code>
                </div>
                <span className="rounded border border-amber-700/70 px-2 py-1 text-xs">{STATUS_LABEL[target.status]}</span>
              </div>
              <p className="mt-2 text-sm text-amber-100/80">{target.message}</p>
              <DiffView diff={target.diff} />
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-amber-900/60 bg-neutral-900/80 p-4">
        <h2 className="text-lg font-semibold text-amber-300">Recent sync events</h2>
        <div className="mt-3 space-y-2">
          {apiState.status?.events.length ? (
            apiState.status.events.map((event) => (
              <div key={event.id} className="rounded border border-amber-950/70 bg-black/30 px-3 py-2 text-sm">
                <div className="text-xs text-amber-100/60">{new Date(event.at).toLocaleString()}</div>
                <div>{event.message}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-amber-100/70">No sync activity yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
