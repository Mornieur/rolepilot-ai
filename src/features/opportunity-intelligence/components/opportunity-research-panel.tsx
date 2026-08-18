import { Alert } from '@/components/feitoza-ui';
import { OpportunityDossierView } from '@/features/opportunity-intelligence/components/opportunity-dossier';
import { ResearchTrigger } from '@/features/opportunity-intelligence/components/research-trigger';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';

export function OpportunityResearchPanel({
  dossier,
  isCurrent,
  profileId,
  jobId,
}: {
  dossier: ResearchDossier | null;
  isCurrent: boolean;
  profileId: string;
  jobId: string;
}) {
  const hasCompletedDossier = dossier?.status === 'completed' && dossier.structuredResult;

  if (hasCompletedDossier)
    return (
      <>
        <OpportunityDossierView dossier={dossier} isCurrent={isCurrent} />
        {!isCurrent && (
          <section className="mt-4" aria-labelledby="refresh-research-heading">
            <Alert variant="warning" title="Pesquisa desatualizada">
              Este resultado anterior é exibido apenas como histórico. Atualize a pesquisa para usar
              evidências e contexto atuais.
            </Alert>
            <div className="mt-4">
              <ResearchTrigger
                profileId={profileId}
                jobId={jobId}
                label="Atualizar pesquisa da oportunidade"
              />
            </div>
          </section>
        )}
      </>
    );

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold">Inteligência da oportunidade</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        A pesquisa é manual e não altera sua decisão nem o score determinístico.
      </p>
      <div className="mt-4">
        <ResearchTrigger profileId={profileId} jobId={jobId} />
      </div>
    </section>
  );
}
