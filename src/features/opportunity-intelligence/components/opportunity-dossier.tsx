import { Card, Badge } from '@/components/feitoza-ui';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';
export function OpportunityDossierView({ dossier }: { dossier: ResearchDossier }) {
  const value = dossier.structuredResult;
  if (!value) return null;
  return (
    <section className="mt-8" aria-labelledby="dossier-heading">
      <h2 id="dossier-heading" className="text-2xl font-semibold">
        Inteligência da oportunidade
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Atualizado em{' '}
        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(value.researchTimestamp),
        )}
        .
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Empresa</h3>
          <p className="mt-2 text-sm">{value.company.overview}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {value.company.categories.map((category) => (
              <Badge key={category.label} variant="neutral">
                {category.label} · {category.confidence}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Remuneração</h3>
          <p className="mt-2 text-sm">
            {value.compensation.estimatedRange ??
              'Não há evidência suficiente para estimar uma faixa confiável.'}
          </p>
          <p className="mt-2 text-sm">Confiança: {value.compensation.confidence}</p>
          {value.compensation.conflicts.map((item) => (
            <p key={item} className="mt-1 text-sm">
              Conflito: {item}
            </p>
          ))}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Processo seletivo</h3>
          <p className="mt-2 text-sm font-medium">Confirmado oficialmente</p>
          <ul className="list-disc pl-5 text-sm">
            {value.hiringProcess.officialKnownStages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-medium">Relatos de candidatos (anecdóticos)</p>
          <ul className="list-disc pl-5 text-sm">
            {value.hiringProcess.anecdotalReportedStages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">O que estudar</h3>
          {[
            ['Must', value.preparation.mustReview],
            ['Should', value.preparation.shouldReview],
            ['Optional', value.preparation.optional],
          ].map(([priority, topics]) => (
            <div key={String(priority)} className="mt-2">
              <p className="text-sm font-medium">{String(priority)}</p>
              {(topics as typeof value.preparation.mustReview).map((topic) => (
                <p key={topic.topic} className="mt-1 text-sm">
                  <strong>{topic.topic}:</strong> {topic.why}
                </p>
              ))}
            </div>
          ))}
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Fontes</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {dossier.sources.map((source) => (
            <li key={source.id}>
              <a
                className="text-sky-700 underline dark:text-cyan-300"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title}
              </a>{' '}
              · {source.domain} · Tier {source.tier} · {source.evidenceClassification}
              {source.publishedAt
                ? ` · ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(source.publishedAt))}`
                : ''}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
