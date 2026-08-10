'use client';

import { useState } from 'react';
import { Button, Card, EmptyState } from '@feitoza-ui/core';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';
import { AiAnalysisCard } from '@/features/ai-job-analysis/components/ai-analysis-card';
import { JobStatusControls } from '@/features/job-actions/components/job-status-controls';
import type { JobUserStatus } from '@/types/domain';
import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';

type Filter = 'all' | 'eligible' | 'rejected';
export function EvaluationResults({
  results,
  statuses = {},
  latestAnalyses = {},
}: {
  results: DeterministicJobEvaluation[];
  statuses?: Record<string, JobUserStatus>;
  latestAnalyses?: Record<string, PersistedAiJobAnalysis & { stale: boolean }>;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = results.filter((result) => filter === 'all' || result.status === filter);
  const eligible = results.filter((result) => result.eligible).length;
  return (
    <section className="mt-8" aria-live="polite" aria-labelledby="evaluation-results-heading">
      <h2 id="evaluation-results-heading" className="text-xl font-semibold">
        Evaluation results
      </h2>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        {results.length} evaluated · {eligible} eligible · {results.length - eligible} rejected
      </p>
      {results.length === 0 ? (
        <EmptyState className="mt-4" title="No persisted jobs to evaluate" />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter evaluation results">
            {(['all', 'eligible', 'rejected'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? 'primary' : 'secondary'}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className="capitalize"
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {visible.map((result) => (
              <article key={result.job.id}>
                <Card className="p-4 sm:p-5">
                  <h3 className="break-words font-semibold">
                    {result.job.title} — {result.status} ({result.score}/100)
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {result.job.provider} · {result.job.location ?? 'Location not provided'}
                  </p>
                  <section className="mt-3" aria-label="Deterministic evaluation">
                    <h4 className="text-sm font-semibold">Deterministic evaluation</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.reasons.map((reason) => (
                        <li key={reason.code} className="break-words">
                          <span className="font-medium">{reason.outcome}:</span> {reason.message}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <JobStatusControls
                    profileId={result.profileId}
                    jobId={result.job.id}
                    currentStatus={statuses[result.job.id] ?? 'new'}
                  />
                  {result.eligible ? (
                    <AiAnalysisCard
                      profileId={result.profileId}
                      jobId={result.job.id}
                      latestAnalysis={latestAnalyses[result.job.id]}
                    />
                  ) : (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      Gemini analysis is available only after deterministic eligibility passes.
                    </p>
                  )}
                  <a
                    href={result.job.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
                  >
                    Open source <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Card>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
