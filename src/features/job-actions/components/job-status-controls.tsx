'use client';

import { useActionState } from 'react';
import { Button } from '@feitoza-ui/core';
import { saveJobStatusAction } from '@/features/job-actions/actions';
import { initialJobStatusActionState } from '@/features/job-actions/action-state';

export function JobStatusControls({
  profileId,
  jobId,
  currentStatus = 'new',
}: {
  profileId: string;
  jobId: string;
  currentStatus?: string;
}) {
  const [state, action, pending] = useActionState(saveJobStatusAction, initialJobStatusActionState);
  const current = state.current ?? currentStatus;
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="jobId" value={jobId} />
      <h4 className="text-sm font-semibold">Your decision</h4>
      <p className="mt-1 text-sm" role="status">
        Current state: {current}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" aria-label="Your decision">
        {['saved', 'ignored', 'applied', 'rejected'].map((status) => (
          <Button
            key={status}
            name="status"
            value={status}
            disabled={pending}
            aria-pressed={current === status}
            variant={current === status ? 'primary' : 'secondary'}
            className="capitalize"
          >
            {status === 'saved'
              ? 'Save'
              : status === 'ignored'
                ? 'Ignore'
                : status[0].toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>
      {state.status === 'success' && (
        <p className="mt-1 text-sm" role="status">
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
