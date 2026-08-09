import { Card } from '@/components/feitoza-ui';
import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="min-h-screen px-4 py-8 sm:px-8 lg:px-12">{children}</main>;
}

export function PageContent({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 pb-8 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-cyan-300">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  tone = 'text-slate-900 dark:text-slate-100',
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </Card>
  );
}
