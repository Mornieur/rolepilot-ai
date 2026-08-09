import { Card } from '@/components/feitoza-ui';
import type { JobInsightResult, RankedInsight } from '../types';

const percent = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }).format(value);
function List({ title, items }: { title: string; items: RankedInsight[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length ? (
        <ol className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex justify-between gap-3 text-sm">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No data in this sample.</p>
      )}
    </Card>
  );
}
export function InsightsDashboard({ insight }: { insight: JobInsightResult }) {
  const warning =
    insight.sampleSize < 10
      ? 'Very small sample: interpret these descriptive counts with caution.'
      : insight.sampleSize < 30
        ? 'Limited sample: interpret these descriptive counts with caution.'
        : null;
  return (
    <div className="mt-8">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Based only on {insight.sampleSize} collected jobs. Decisions are specific to{' '}
        {insight.profile.name}.
      </p>
      {warning && (
        <p
          role="status"
          className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          {warning}
        </p>
      )}
      <section
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Insight summary"
      >
        <InsightMetricCard label="Collected jobs" value={insight.sampleSize} />
        <InsightMetricCard label="Saved" value={insight.statuses.saved} />
        <InsightMetricCard label="Applied" value={insight.statuses.applied} />
        <InsightMetricCard label="No decision" value={insight.statuses.new} />
        <InsightMetricCard label="Save rate" value={percent(insight.saveRate)} />
        <InsightMetricCard label="Application rate" value={percent(insight.applicationRate)} />
        <InsightMetricCard label="Ignored" value={insight.statuses.ignored} />
        <InsightMetricCard label="Rejected" value={insight.statuses.rejected} />
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <List title="Companies with most collected jobs" items={insight.companies} />
        <List title="Most recurring titles" items={insight.titles} />
        <List title="Locations in the collected sample" items={insight.locations} />
        <List title="Work model in the collected sample" items={insight.workModels} />
        <List title="Seniority in the collected sample" items={insight.seniorities} />
        <List title="Providers" items={insight.providers} />
        <List title="Profile terms found in the sample" items={insight.profileTerms.found} />
        <List title="Profile terms in saved jobs" items={insight.profileTerms.saved} />
        <List title="Profile terms in applied jobs" items={insight.profileTerms.applied} />
        <List title="Profile terms in ignored jobs" items={insight.profileTerms.ignored} />
      </div>
      {insight.profileTerms.rare.length > 0 && (
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Configured terms not found in this sample: {insight.profileTerms.rare.join(', ')}.
        </p>
      )}
    </div>
  );
}
function InsightMetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
