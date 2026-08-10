'use client';

import { useActionState } from 'react';
import { Button, Surface } from '@feitoza-ui/core';
import { analyzeJobAction } from '@/features/ai-job-analysis/actions';
import { initialAiAnalysisActionState } from '@/features/ai-job-analysis/action-state';
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
        Análise manual com Gemini
      </h3>
      <p className="mt-1 text-sm">
        Análise assistida por Gemini — revise antes de decidir candidatar-se.
      </p>
      {displayed?.stale && (
        <p role="status" className="mt-3 text-sm text-amber-800 dark:text-amber-200">
          Esta análise está desatualizada porque o perfil ou a vaga mudou após o salvamento.
        </p>
      )}
      {displayed && (
        <div className="mt-3 text-sm">
          <p role="status">Análise salva: {displayed.stale ? 'desatualizada' : 'atual'}.</p>
          <p className="mt-1 font-medium">
            {displayed.analysis.recommendation} · confiança {displayed.analysis.confidence}
          </p>
          <p className="mt-1 break-words">{displayed.analysis.summary}</p>
          <p className="mt-2">
            Pontuação determinística: {displayed.analysis.deterministicAssessment.score}/100
          </p>
          <details className="mt-3 text-xs text-slate-600 dark:text-slate-300">
            <summary className="cursor-pointer font-medium">Detalhes da análise</summary>
            <p className="mt-1">Analisada em: {new Date(displayed.createdAt).toLocaleString()}</p>
            <p>
              Provedor/modelo: {displayed.provider} / {displayed.model}
            </p>
          </details>
          <List
            title="Pontos fortes"
            items={displayed.analysis.strengths.map((item) => `${item.title}: ${item.evidence}`)}
          />
          <List
            title="Lacunas"
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
          {pending ? 'Analisando…' : displayed ? 'Reanalisar com Gemini' : 'Analisar com Gemini'}
        </Button>
      </form>
      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      {displayed && <List title="Riscos" items={displayed.analysis.risks} />}
      {displayed && <List title="Foco para entrevista" items={displayed.analysis.interviewFocus} />}
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
