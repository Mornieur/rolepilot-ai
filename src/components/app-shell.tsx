'use client';

import Link from 'next/link';
import { Button } from '@feitoza-ui/core';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const key = 'rolepilot-theme';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const saved = localStorage.getItem(key) as Theme | null;
    const next =
      saved ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    queueMicrotask(() => setTheme(next));
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(key, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
  return (
    <>
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-slate-900 dark:text-slate-100">
            RolePilot AI
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-3 text-sm">
            <Link href="/profiles">Profiles</Link>
            <Link href="/companies">Companies</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/insights">Insights</Link>
            <Button
              type="button"
              variant="secondary"
              aria-pressed={theme === 'dark'}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              onClick={toggle}
            >
              Theme: {theme}
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
