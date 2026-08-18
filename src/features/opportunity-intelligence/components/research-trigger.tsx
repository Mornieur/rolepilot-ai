'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@feitoza-ui/core';
import { researchOpportunityAction } from '@/features/opportunity-intelligence/actions';
import { initialOpportunityResearchActionState } from '@/features/opportunity-intelligence/action-state';
export function ResearchTrigger({
  profileId,
  jobId,
  disabled = false,
  label = 'Pesquisar empresa e preparar candidatura',
}: {
  profileId: string;
  jobId: string;
  disabled?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    researchOpportunityAction,
    initialOpportunityResearchActionState,
  );
  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status]);
  return (
    <form action={action}>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="jobId" value={jobId} />
      <Button type="submit" disabled={disabled || pending}>
        {pending ? 'Pesquisando…' : label}
      </Button>
      {state.message && (
        <p className="mt-2 text-sm" role={state.status === 'error' ? 'alert' : 'status'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
