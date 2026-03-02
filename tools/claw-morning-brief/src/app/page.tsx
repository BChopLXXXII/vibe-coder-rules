'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Brief {
  date: string;
  generatedAt: string;
  raw: string;
  whatGotDone: { text: string; status: string }[];
  needsAttention: { text: string; status: string }[];
  suggestedFirstAction: string;
  filesChanged: { modified: number; added: number; deleted: number };
  tokenSpend: { sessionCount: number; estimatedCost: string };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    complete: 'bg-green-500/10 text-green-400 border-green-500/20',
    partial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const icons: Record<string, string> = {
    complete: '✅',
    partial: '⚠️',
    failed: '❌',
    info: 'ℹ️',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors[status] || colors.info}`}>
      {icons[status] || icons.info} {status}
    </span>
  );
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-amber-500 font-bold text-lg mb-3 pb-2 border-b border-[var(--color-border)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatestBrief = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/briefs');
      const data = await res.json();
      if (data.briefs && data.briefs.length > 0) {
        const latest = data.briefs[0];
        const detailRes = await fetch(`/api/briefs/${latest.date}`);
        const detailData = await detailRes.json();
        // We store the raw content; parse for display
        setBrief({
          date: latest.date,
          generatedAt: new Date().toISOString(),
          raw: detailData.content,
          whatGotDone: [],
          needsAttention: [],
          suggestedFirstAction: '',
          filesChanged: { modified: 0, added: 0, deleted: 0 },
          tokenSpend: { sessionCount: 0, estimatedCost: 'N/A' },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brief');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestBrief();
  }, [loadLatestBrief]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBrief(data.brief);
      } else {
        setError(data.error || 'Failed to generate brief');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate brief');
    } finally {
      setGenerating(false);
    }
  };

  const renderMarkdown = (raw: string) => {
    // Simple markdown renderer
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-amber-500 font-bold text-lg mt-6 mb-3 pb-2 border-b border-[var(--color-border)]">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-[var(--color-text)] font-semibold mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        const text = line.replace('- ', '');
        let statusClass = '';
        if (text.includes('✅')) statusClass = 'border-l-green-500';
        else if (text.includes('⚠️')) statusClass = 'border-l-yellow-500';
        else if (text.includes('❌')) statusClass = 'border-l-red-500';
        else statusClass = 'border-l-[var(--color-border)]';

        elements.push(
          <div key={key++} className={`pl-3 py-1.5 border-l-2 ${statusClass} mb-1 text-sm`}>
            {text}
          </div>
        );
      } else if (line.startsWith('🌅 ')) {
        elements.push(
          <h1 key={key++} className="text-2xl font-bold text-amber-500 mb-1">
            {line}
          </h1>
        );
      } else if (line.startsWith('Generated:')) {
        elements.push(
          <p key={key++} className="text-[var(--color-text-muted)] text-sm mb-4">
            {line}
          </p>
        );
      } else if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
        elements.push(
          <code key={key++} className="block bg-[var(--color-surface)] text-amber-500 px-3 py-1 rounded text-sm mb-1">
            {line.trim().replace(/`/g, '')}
          </code>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={key++} className="text-sm text-[var(--color-text)] mb-1">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Your overnight agent activity at a glance
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-pulse-amber">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>🌅</span>
              Generate Brief
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !brief && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <div className="animate-pulse-amber text-4xl mb-4">🌅</div>
          <p>Loading latest brief...</p>
        </div>
      )}

      {/* No briefs */}
      {!loading && !brief && !error && (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div className="text-5xl mb-4">🌅</div>
          <h2 className="text-xl font-bold mb-2">No briefs yet</h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Click &ldquo;Generate Brief&rdquo; to create your first morning summary
          </p>
        </div>
      )}

      {/* Brief display */}
      {brief && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          {brief.raw ? (
            <div className="brief-content">{renderMarkdown(brief.raw)}</div>
          ) : (
            <>
              <BriefSection title="What Got Done">
                {brief.whatGotDone.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <StatusBadge status={item.status} />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </BriefSection>

              <BriefSection title="Files Changed">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">{brief.filesChanged.added} added</span>
                  <span className="text-amber-400">{brief.filesChanged.modified} modified</span>
                  <span className="text-red-400">{brief.filesChanged.deleted} deleted</span>
                </div>
              </BriefSection>

              <BriefSection title="Token Spend">
                <p className="text-sm">Sessions: {brief.tokenSpend.sessionCount}</p>
                <p className="text-sm">Est. Cost: {brief.tokenSpend.estimatedCost}</p>
              </BriefSection>

              <BriefSection title="Needs Your Attention">
                {brief.needsAttention.length === 0 ? (
                  <p className="text-green-400 text-sm">✅ Nothing urgent — all clear!</p>
                ) : (
                  brief.needsAttention.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <StatusBadge status={item.status} />
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))
                )}
              </BriefSection>

              <BriefSection title="Suggested First Action">
                <p className="text-amber-500 font-semibold">{brief.suggestedFirstAction}</p>
              </BriefSection>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Brief for {brief.date}</span>
            <Link href={`/briefs/${brief.date}`} className="text-amber-500 hover:text-amber-400 transition-colors">
              View full brief →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
