import { Badge, Card } from '@/components/feitoza-ui';
import type {
  DossierEvidenceClass,
  OpportunityDossier,
  PreparationTopic,
  ResearchDossier,
  ResearchSource,
} from '@/features/opportunity-intelligence/types';

const evidenceLabels: Record<DossierEvidenceClass, string> = {
  known: 'Confirmado',
  likely: 'Provável',
  anecdotal: 'Relato / fonte comunitária',
  unknown: 'Não confirmado',
};
const confidenceLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' } as const;
const unknownValues = new Set(['Unknown.', 'No provider finding.']);

export function presentationLabel(value: string) {
  return unknownValues.has(value) ? 'Não confirmado pelas fontes pesquisadas.' : value;
}

export function sourceBadge(source: Pick<ResearchSource, 'tier' | 'sourceKind'>) {
  if (source.tier === 1 || source.sourceKind === 'official') return 'Oficial';
  if (source.sourceKind === 'career_platform') return 'Mercado';
  if (source.tier === 3 || source.sourceKind === 'community') return 'Comunidade';
  return 'Imprensa / fonte especializada';
}

export function formatCompensationRange(range: string) {
  return range
    .replace(/R\$\s*(\d+(?:[.,]\d+)?)\s*[kK]\b/g, (_, value: string) => `R$ ${value} mil`)
    .replace(/\s+-\s+/g, ' – ');
}

function hasAnnualPeriod(unit: string | null) {
  return Boolean(unit && /\b(ano|anual|year|annual|yr)\b/i.test(unit));
}

function uniqueTopics(topics: PreparationTopic[]) {
  return topics.filter(
    (topic, index) =>
      topics.findIndex(
        (candidate) =>
          candidate.topic.trim().toLocaleLowerCase('pt-BR') ===
            topic.topic.trim().toLocaleLowerCase('pt-BR') &&
          candidate.why.trim().toLocaleLowerCase('pt-BR') ===
            topic.why.trim().toLocaleLowerCase('pt-BR'),
      ) === index,
  );
}

function StudyTopics({ topics }: { topics: PreparationTopic[] }) {
  return (
    <ul className="mt-2 space-y-3 text-sm">
      {uniqueTopics(topics).map((topic) => {
        const duplicate =
          topic.topic.trim().toLocaleLowerCase('pt-BR') ===
          topic.why.trim().toLocaleLowerCase('pt-BR');
        return (
          <li key={`${topic.topic}-${topic.why}`}>
            <p className="font-medium">{topic.topic}</p>
            {!duplicate && <p className="mt-1 text-slate-700 dark:text-slate-200">{topic.why}</p>}
            {topic.evidence.length > 0 && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Com apoio das fontes pesquisadas
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CompanyFacts({ company }: { company: OpportunityDossier['company'] }) {
  const facts = [
    ['Modelo de negócio', company.businessModel],
    ['Tipo', company.publicPrivateStatus],
    ['Estágio', company.stage],
    ['Porte', company.size],
    ['Atuação', company.markets.length ? company.markets.join(', ') : 'Unknown.'],
  ];
  return (
    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {label}
          </dt>
          <dd className="mt-1 text-sm">{presentationLabel(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OpportunityDossierView({
  dossier,
  isCurrent = true,
}: {
  dossier: ResearchDossier;
  isCurrent?: boolean;
}) {
  const value = dossier.structuredResult;
  if (!value) return null;
  const moment = value.companyMoment;
  const impacts = Object.entries(value.careerImpact)
    .filter(([, impact]) => impact.level !== 'unknown' && !unknownValues.has(impact.explanation))
    .reduce<{ explanation: string; level: string; dimensions: string[] }[]>(
      (items, [dimension, impact]) => {
        const existing = items.find(
          (item) => item.explanation === impact.explanation && item.level === impact.level,
        );
        const label =
          {
            technicalGrowth: 'crescimento técnico',
            leadershipExposure: 'liderança',
            aiExposure: 'IA',
            productExposure: 'produto',
            internationalExposure: 'exposição internacional',
            compensationUpside: 'remuneração',
            roleScopeRisk: 'escopo da função',
          }[dimension] ?? dimension;
        if (existing) existing.dimensions.push(label);
        else
          items.push({ explanation: impact.explanation, level: impact.level, dimensions: [label] });
        return items;
      },
      [],
    );
  const studyGroups = [
    ['Prioridade', value.preparation.mustReview],
    ['Recomendado', value.preparation.shouldReview],
    ['Diferencial', value.preparation.optional],
    ['Preparação comportamental', value.preparation.behavioral],
    ['Conhecimento da empresa', value.preparation.companyKnowledge],
  ] as const;
  const hasIndirectSources = dossier.sources.some((source) => source.tier !== 1);

  return (
    <section className="mt-8" aria-labelledby="dossier-heading">
      <h2 id="dossier-heading" className="text-2xl font-semibold">
        Inteligência da oportunidade
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {isCurrent ? 'Pesquisa atualizada em ' : 'Pesquisa histórica, realizada em '}
        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(value.researchTimestamp),
        )}
        .
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Empresa</h3>
          <CompanyFacts company={value.company} />
          {value.company.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {value.company.categories.map((category) => (
                <Badge key={category.label} variant="neutral">
                  {category.label} · {evidenceLabels[category.confidence]}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
            {value.company.overview}
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Remuneração estimada</h3>
          {value.compensation.estimatedRange ? (
            <>
              <p className="mt-2 text-sm font-medium">
                {formatCompensationRange(value.compensation.estimatedRange)}
                {hasAnnualPeriod(value.compensation.currencyUnit) ? ' / ano' : ''}
              </p>
              {!hasAnnualPeriod(value.compensation.currencyUnit) && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Período não confirmado.
                </p>
              )}
              <p className="mt-2 text-sm">
                Confiança da estimativa: {confidenceLabels[value.compensation.confidence]}
              </p>
              <ListSection
                title="Com base nas evidências pesquisadas"
                items={value.compensation.observations}
              />
            </>
          ) : (
            <p className="mt-2 text-sm">
              Não encontramos evidência suficiente para estimar uma faixa confiável.
            </p>
          )}
          <ListSection
            title="Pontos a confirmar"
            items={[...value.compensation.conflicts, ...value.compensation.unknowns]}
          />
        </Card>
      </div>

      {(moment.knownFacts.length ||
        moment.recentDevelopments.length ||
        moment.inferences.length) && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Momento da empresa</h3>
          <ListSection title="Acontecimentos e fatos observados" items={moment.knownFacts} />
          <ListSection title="Desenvolvimentos recentes" items={moment.recentDevelopments} />
          <ListSection title="Leituras a confirmar" items={moment.inferences} />
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Processo seletivo</h3>
          <ListSection
            title="Informações oficiais"
            items={value.hiringProcess.officialKnownStages}
          />
          <ListSection
            title="Relatos de candidatos"
            items={value.hiringProcess.anecdotalReportedStages}
          />
          {value.hiringProcess.anecdotalReportedStages.length > 0 && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Experiências individuais podem variar.
            </p>
          )}
          <ListSection
            title="Expectativas prováveis"
            items={value.hiringProcess.likelyExpectations}
          />
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Plano de estudo</h3>
          {studyGroups.map(([title, topics]) =>
            topics.length ? (
              <div key={title} className="mt-4">
                <h4 className="text-sm font-semibold">{title}</h4>
                <StudyTopics topics={topics} />
              </div>
            ) : null,
          )}
        </Card>
      </div>

      {(value.candidateFit.alreadyStrong.length ||
        value.candidateFit.refresh.length ||
        value.candidateFit.realGaps.length ||
        value.candidateFit.unknowns.length) && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Seu encaixe</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Análise contextual baseada na pesquisa da oportunidade.
          </p>
          <div className="grid gap-1 md:grid-cols-2">
            <ListSection title="Pontos fortes" items={value.candidateFit.alreadyStrong} />
            <ListSection title="O que revisar" items={value.candidateFit.refresh} />
            <ListSection title="Lacunas" items={value.candidateFit.realGaps} />
            <ListSection title="Pontos de atenção" items={value.candidateFit.unknowns} />
          </div>
        </Card>
      )}

      {impacts.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Impacto na sua carreira</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {impacts.map((impact) => (
              <li key={impact.explanation}>
                <p className="font-medium">{impact.dimensions.join(', ')}</p>
                <p className="mt-1 text-slate-700 dark:text-slate-200">{impact.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(value.applicationPositioning.emphasize.length ||
        value.applicationPositioning.storiesToPrepare.length ||
        value.applicationPositioning.evidenceToQuantify.length) && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Como se posicionar</h3>
          <div className="grid gap-1 md:grid-cols-3">
            <ListSection title="Dê ênfase a" items={value.applicationPositioning.emphasize} />
            <ListSection
              title="Histórias para preparar"
              items={value.applicationPositioning.storiesToPrepare}
            />
            <ListSection
              title="Resultados para quantificar"
              items={value.applicationPositioning.evidenceToQuantify}
            />
          </div>
        </Card>
      )}

      {value.questionsToInvestigate.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="font-semibold">Perguntas para levar ao processo</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {value.questionsToInvestigate.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Fontes</h3>
        {hasIndirectSources && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Algumas evidências são indiretas ou comunitárias.
          </p>
        )}
        <ul className="mt-3 space-y-3 text-sm">
          {dossier.sources.map((source) => (
            <li key={source.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <a
                className="text-sky-700 underline dark:text-cyan-300"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title}
              </a>
              <span className="text-slate-600 dark:text-slate-300">{source.domain}</span>
              <Badge variant="neutral">{sourceBadge(source)}</Badge>
              <span className="text-slate-600 dark:text-slate-300">
                {evidenceLabels[source.evidenceClassification]}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
