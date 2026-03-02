'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BriefDetailPage() {
  const params = useParams<{ date: string }>();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/briefs/${params.date}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load brief');
        setContent(data.content || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    };

    if (params.date) load();
  }, [params.date]);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading brief...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
      <pre className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)] font-sans">{content}</pre>
    </div>
  );
}
