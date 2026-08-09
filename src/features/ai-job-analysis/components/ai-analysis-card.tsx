'use client';

import { useActionState } from 'react';
import { Button, Surface } from '@feitoza-ui/core';
import { analyzeJobAction, initialAiAnalysisActionState } from '@/features/ai-job-analysis/actions';

export function AiAnalysisCard({
  profileId,
  jobId,
  score,
}: {
  profileId: string;
  jobId: string;
  score: number;
}) {
  const [state, action, pending] = useActionState(analyzeJobAction, initialAiAnalysisActionState);
  return (
    <Surface className="mt-4 p-4" aria-labelledby={`ai-${jobId}`}>
      <h3 id={`ai-${jobId}`} className="font-semibold">
        Manual Gemini analysis
      </h3>
      <p className="mt-1 text-sm">
        Gemini-assisted analysis — review before deciding to apply. No application is submitted
        automatically.
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="jobId" value={jobId} />
        <Button type="submit" disabled={pending}>
          {pending ? 'Analyzing…' : 'Analyze with Gemini'}
        </Button>
      </form>
      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      {state.status === 'success' && (
        <div className="mt-4">
          <p role="status" className="text-sm font-medium">
            {state.analysis.recommendation} · {state.analysis.confidence} confidence
          </p>
          <p className="mt-2 break-words text-sm">{state.analysis.summary}</p>
          <p className="mt-2 text-sm">Deterministic score: {score}/100</p>
          <List
            title="Strengths"
            items={state.analysis.strengths.map((item) => `${item.title}: ${item.evidence}`)}
          />
          <List
            title="Gaps"
            items={state.analysis.gaps.map(
              (item) => `${item.title} (${item.severity}): ${item.explanation}`,
            )}
          />
          <List title="Risks" items={state.analysis.risks} />
          <List title="Interview focus" items={state.analysis.interviewFocus} />
        </div>
      )}
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
