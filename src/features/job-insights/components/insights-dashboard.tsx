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
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Sem dados nesta amostra.</p>
      )}
    </Card>
  );
}
export function InsightsDashboard({
  insight,
  scope = 'all',
}: {
  insight: JobInsightResult;
  scope?: 'all' | 'relevant';
}) {
  const warning =
    insight.sampleSize < 10
      ? 'Amostra muito pequena: interprete estas contagens descritivas com cautela.'
      : insight.sampleSize < 30
        ? 'Amostra limitada: interprete estas contagens descritivas com cautela.'
        : null;
  return (
    <div className="mt-8">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {scope === 'relevant'
          ? `Com base em ${insight.sampleSize} vagas compatíveis com este perfil.`
          : `Com base em ${insight.sampleSize} vagas coletadas.`}{' '}
        As decisões são específicas de {insight.profile.name}.
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
        <InsightMetricCard
          label={scope === 'relevant' ? 'Vagas compatíveis' : 'Vagas coletadas'}
          value={insight.sampleSize}
        />
        <InsightMetricCard label="Salvas" value={insight.statuses.saved} />
        <InsightMetricCard label="Candidatadas" value={insight.statuses.applied} />
        <InsightMetricCard label="Sem decisão" value={insight.statuses.new} />
        <InsightMetricCard label="Taxa de salvamento" value={percent(insight.saveRate)} />
        <InsightMetricCard label="Taxa de candidatura" value={percent(insight.applicationRate)} />
        <InsightMetricCard label="Ignoradas" value={insight.statuses.ignored} />
        <InsightMetricCard label="Rejeitadas" value={insight.statuses.rejected} />
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <List title="Empresas com mais vagas coletadas" items={insight.companies} />
        <List title="Cargos mais recorrentes" items={insight.titles} />
        <List title="Localizações na amostra" items={insight.locations} />
        <List title="Modelos de trabalho na amostra" items={insight.workModels} />
        <List title="Senioridades na amostra" items={insight.seniorities} />
        <List title="Provedores" items={insight.providers} />
        <List title="Termos do perfil encontrados" items={insight.profileTerms.found} />
        <List title="Termos do perfil em vagas salvas" items={insight.profileTerms.saved} />
        <List title="Termos do perfil em vagas candidatadas" items={insight.profileTerms.applied} />
        <List title="Termos do perfil em vagas ignoradas" items={insight.profileTerms.ignored} />
      </div>
      {insight.profileTerms.rare.length > 0 && (
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Termos configurados não encontrados nesta amostra: {insight.profileTerms.rare.join(', ')}.
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
