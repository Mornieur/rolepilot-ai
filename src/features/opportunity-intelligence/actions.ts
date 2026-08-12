'use server';
import { z } from 'zod';
import { requireCurrentUser, AuthorizationError } from '@/features/auth/server/auth';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import { researchOpportunity, OpportunityResearchError } from './server/research/pipeline';
import type { OpportunityResearchActionState } from './action-state';
const ids = z.object({ profileId: z.string().uuid(), jobId: z.string().uuid() });
export async function researchOpportunityAction(
  _: OpportunityResearchActionState,
  formData: FormData,
): Promise<OpportunityResearchActionState> {
  const parsed = ids.safeParse({
    profileId: formData.get('profileId'),
    jobId: formData.get('jobId'),
  });
  if (!parsed.success)
    return { status: 'error', message: 'Não foi possível identificar a oportunidade.' };
  try {
    const user = await requireCurrentUser();
    const { data } = await getSupabaseServerClient()
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', parsed.data.profileId)
      .maybeSingle();
    if (!data || (user.role !== 'admin' && data.user_id !== user.id))
      throw new AuthorizationError();
    await researchOpportunity(parsed.data.profileId, parsed.data.jobId);
    return { status: 'success', message: 'Pesquisa concluída.' };
  } catch (error) {
    const classification =
      error instanceof OpportunityResearchError ? error.classification : 'preflight_or_persistence';
    console.warn(
      `Opportunity research failed: stage=server_action classification=${classification}`,
    );
    return {
      status: 'error',
      message:
        error instanceof OpportunityResearchError
          ? error.message
          : 'Não foi possível pesquisar a oportunidade agora.',
    };
  }
}
