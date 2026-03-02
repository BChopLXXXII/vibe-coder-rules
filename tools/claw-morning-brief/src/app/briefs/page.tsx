'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BriefListItem {
  date: string;
  filename: string;
  summary: string;
  hasAttentionItems: boolean;
  itemCount: number;
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<BriefListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/briefs');
        const data = await res.json();
        setBriefs(data.briefs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load briefs');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading briefs...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Briefs</h1>
      {briefs.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 text-sm text-[var(--color-text-muted)]">
          No brief files found yet.
        </div>
      ) : (
        briefs.map((brief) => (
          <Link
            key={brief.filename}
            href={`/briefs/${brief.date}`}
            className="block bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-amber-500">{brief.date}</span>
              {brief.hasAttentionItems ? <span className="text-yellow-400 text-xs">⚠️ attention</span> : <span className="text-green-400 text-xs">✅ clear</span>}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{brief.summary || `${brief.itemCount} items logged`}</p>
          </Link>
        ))
      )}
    </div>
  );
}
