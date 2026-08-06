"use client";

import { useState } from "react";
import type { DeterministicJobEvaluation } from "@/features/job-evaluation/types";

type Filter = "all" | "eligible" | "rejected";

export function EvaluationResults({ results }: { results: DeterministicJobEvaluation[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = results.filter((result) => filter === "all" || result.status === filter);
  const eligible = results.filter((result) => result.eligible).length;

  return <section className="mt-8" aria-live="polite">
    <p>{results.length} evaluated · {eligible} eligible · {results.length - eligible} rejected</p>
    {results.length === 0 ? <p className="mt-4">No persisted jobs to evaluate.</p> : <>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter evaluation results">
        {(["all", "eligible", "rejected"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className="rounded border border-slate-300 bg-white px-3 py-1 text-sm capitalize">{value}</button>)}
      </div>
      <div className="mt-4 space-y-4">
        {visible.map((result) => <article key={result.job.id} className="rounded border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">{result.job.title} — {result.status} ({result.score}/100)</h2>
          <p className="mt-1 text-sm text-slate-600">{result.job.provider} · {result.job.location ?? "Location not provided"}</p>
          <ul className="mt-2 text-sm">{result.reasons.map((reason) => <li key={reason.code}>{reason.outcome}: {reason.message}</li>)}</ul>
          <a href={result.job.originalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-blue-700 underline">Open source</a>
        </article>)}
      </div>
    </>}
  </section>;
}
