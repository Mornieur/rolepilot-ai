'use client';

import { useActionState } from 'react';
import { Button, Surface } from '@feitoza-ui/core';
import { analyzeJobAction, initialAiAnalysisActionState } from '@/features/ai-job-analysis/actions';
import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';

export function AiAnalysisCard({
  profileId,
  jobId,
  latestAnalysis,
}: {
  profileId: string;
  jobId: string;
  latestAnalysis?: (PersistedAiJobAnalysis & { stale: boolean }) | null;
}) {
  const [state, action, pending] = useActionState(analyzeJobAction, initialAiAnalysisActionState);
  const displayed =
    state.status === 'success' ? { ...state.analysis, stale: false } : latestAnalysis;
  return (
    <Surface className="mt-4 p-4" aria-labelledby={`ai-${jobId}`}>
      <h3 id={`ai-${jobId}`} className="font-semibold">
        Manual Gemini analysis
      </h3>
      <p className="mt-1 text-sm">Gemini-assisted analysis — review before deciding to apply.</p>
      {displayed?.stale && (
        <p role="status" className="mt-3 text-sm text-amber-800 dark:text-amber-200">
          This analysis is stale because the profile or job context changed after it was saved.
        </p>
      )}
      {displayed && (
        <div className="mt-3 text-sm">
          <p role="status">Saved analysis: {displayed.stale ? 'stale' : 'current'}.</p>
          <p className="mt-1 font-medium">
            {displayed.analysis.recommendation} · {displayed.analysis.confidence} confidence
          </p>
          <p className="mt-1 break-words">{displayed.analysis.summary}</p>
          <p className="mt-2">
            Deterministic score: {displayed.analysis.deterministicAssessment.score}/100
          </p>
          <details className="mt-3 text-xs text-slate-600 dark:text-slate-300">
            <summary className="cursor-pointer font-medium">Analysis details</summary>
            <p className="mt-1">Analyzed: {new Date(displayed.createdAt).toLocaleString()}</p>
            <p>
              Provider/model: {displayed.provider} / {displayed.model}
            </p>
          </details>
          <List
            title="Strengths"
            items={displayed.analysis.strengths.map((item) => `${item.title}: ${item.evidence}`)}
          />
          <List
            title="Gaps"
            items={displayed.analysis.gaps.map(
              (item) => `${item.title} (${item.severity}): ${item.explanation}`,
            )}
          />
        </div>
      )}
      <form action={action} className="mt-3">
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="jobId" value={jobId} />
        <Button type="submit" disabled={pending}>
          {pending ? 'Analyzing…' : displayed ? 'Reanalyze with Gemini' : 'Analyze with Gemini'}
        </Button>
      </form>
      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      {displayed && <List title="Risks" items={displayed.analysis.risks} />}
      {displayed && <List title="Interview focus" items={displayed.analysis.interviewFocus} />}
    </Surface>
  );
}
function List({ title, items }: { title: string; items: string[] }) {
  return items.length ? (
    <div className="mt-3">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="list-disc pl-5 text-sm">
        {items.map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}
