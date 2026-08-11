import Link from 'next/link';
import { Alert, EmptyState, Select, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { selectAccessibleProfile } from '@/features/auth/policy';
import { requirePageUser } from '@/features/auth/server/auth';
import { OpportunityInbox } from '@/features/opportunity-inbox/components/opportunity-inbox';
import {
  OpportunityInboxDataError,
  loadOpportunityInbox,
} from '@/features/opportunity-inbox/server/load-opportunity-inbox';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';

export const dynamic = 'force-dynamic';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const currentUser = await requirePageUser();
  const [params, profiles] = await Promise.all([searchParams, loadCandidateProfiles(currentUser)]);
  if (profiles.error || !profiles.profiles)
    return (
      <PageContainer>
        <Alert variant="danger" title="Perfis indisponíveis">
          {profiles.error ?? 'Tente novamente.'}
        </Alert>
      </PageContainer>
    );
  const profile = selectAccessibleProfile(profiles.profiles, params.profileId);
  const error = params.profileId && !profile ? 'Perfil indisponível.' : null;
  let inbox = null;
  let loadError = error;
  if (profile)
    try {
      inbox = await loadOpportunityInbox(profile);
    } catch (caught) {
      loadError =
        caught instanceof OpportunityInboxDataError
          ? caught.message
          : 'A Caixa de oportunidades está indisponível neste momento.';
    }
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Caixa de oportunidades"
          description="Vagas atuais e compatíveis que merecem sua atenção agora."
          actions={
            <Link
              href="/jobs/evaluate"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Avaliar vagas
            </Link>
          }
        />
        {profiles.profiles.length ? (
          <Surface className="mt-6 p-5">
            <form>
              <Select
                id="profileId"
                name="profileId"
                label="Perfil"
                defaultValue={profile?.id ?? ''}
                fullWidth
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {profiles.profiles.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </Select>
            </form>
          </Surface>
        ) : (
          <EmptyState
            className="mt-6"
            title="Crie um perfil primeiro"
            description="Um perfil é necessário antes de abrir a Caixa de oportunidades."
          />
        )}
        {loadError && (
          <Alert
            className="mt-6"
            variant="danger"
            title="Caixa de oportunidades indisponível"
            role="alert"
          >
            {loadError}
          </Alert>
        )}
        {profile && inbox && (
          <OpportunityInbox
            profileId={profile.id}
            opportunities={inbox.opportunities}
            summary={inbox.summary}
          />
        )}
      </PageContent>
    </PageContainer>
  );
}
