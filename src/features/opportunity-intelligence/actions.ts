'use server';

import { z } from 'zod';
import {
  requireCurrentUser,
  AuthenticationRequiredError,
  AuthorizationError,
} from '@/features/auth/server/auth';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import { researchOpportunity, OpportunityResearchError } from './server/research/pipeline';
import {
  createOpportunityResearchExecutionId,
  logOpportunityResearch,
  type OpportunityResearchFailureClassification,
  type OpportunityResearchStage,
} from './server/research/observability';
import type { OpportunityResearchActionState } from './action-state';

const ids = z.object({ profileId: z.string().uuid(), jobId: z.string().uuid() });

export async function researchOpportunityAction(
  _: OpportunityResearchActionState,
  formData: FormData,
): Promise<OpportunityResearchActionState> {
  const execution = createOpportunityResearchExecutionId();
  let activeStage: OpportunityResearchStage = 'input';
  logOpportunityResearch({ execution, stage: 'pipeline', outcome: 'start' });
  const parsed = ids.safeParse({
    profileId: formData.get('profileId'),
    jobId: formData.get('jobId'),
  });
  if (!parsed.success) {
    logOpportunityResearch({
      execution,
      stage: activeStage,
      outcome: 'failed',
      classification: 'invalid_input',
    });
    return { status: 'error', message: 'N\u00e3o foi poss\u00edvel identificar a oportunidade.' };
  }
  try {
    activeStage = 'auth';
    const user = await requireCurrentUser();
    logOpportunityResearch({ execution, stage: activeStage, outcome: 'success' });
    activeStage = 'authorization';
    const { data, error } = await getSupabaseServerClient()
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', parsed.data.profileId)
      .maybeSingle();
    if (error) throw new OpportunityResearchError('data_access');
    if (!data || (user.role !== 'admin' && data.user_id !== user.id))
      throw new AuthorizationError();
    logOpportunityResearch({ execution, stage: activeStage, outcome: 'success' });
    await researchOpportunity(parsed.data.profileId, parsed.data.jobId, undefined, execution);
    return { status: 'success', message: 'Pesquisa conclu\u00edda.' };
  } catch (error) {
    const classification: OpportunityResearchFailureClassification =
      error instanceof OpportunityResearchError
        ? error.classification
        : error instanceof AuthenticationRequiredError
          ? 'authentication'
          : error instanceof AuthorizationError
            ? 'authorization'
            : 'unexpected';
    logOpportunityResearch({ execution, stage: activeStage, outcome: 'failed', classification });
    return {
      status: 'error',
      message:
        error instanceof OpportunityResearchError
          ? error.message
          : 'N\u00e3o foi poss\u00edvel pesquisar a oportunidade agora.',
    };
  }
}
