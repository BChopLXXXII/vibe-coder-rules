import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Morning Brief — claw-morning-brief',
  description: 'Wake up knowing what your overnight agents did',
};

function Nav() {
  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[var(--color-accent)] font-bold text-lg hover:opacity-80 transition-opacity">
          <span className="text-2xl">🌅</span>
          <span>Morning Brief</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            Dashboard
          </Link>
          <Link href="/briefs" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            All Briefs
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
