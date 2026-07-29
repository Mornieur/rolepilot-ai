"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { getMockAnalysis } from "@/features/jobs/mock-data";
import { formatLabel, formatScore } from "@/lib/format";
import type { CandidateProfile, Job, JobAnalysis, Recommendation, TargetCompany } from "@/types/domain";

type DashboardProps = {
  profiles: CandidateProfile[];
  jobs: Job[];
  analyses: JobAnalysis[];
  companies?: TargetCompany[];
  companyError?: string | null;
};

const recommendationStyles: Record<Recommendation, string> = {
  recommended: "bg-emerald-100 text-emerald-900",
  consider: "bg-amber-100 text-amber-950",
  skipped: "bg-slate-200 text-slate-700",
};

export function Dashboard({ profiles, jobs, analyses, companies = [], companyError = null }: DashboardProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];

    return jobs.flatMap((job) => {
      const analysis = getMockAnalysis(selectedProfile.id, job.id, analyses);
      return analysis ? [{ job, analysis }] : [];
    }).sort((left, right) => right.analysis.score - left.analysis.score);
  }, [analyses, jobs, selectedProfile]);

  if (!selectedProfile) return <EmptyDashboard />;

  const recommendationCount = (recommendation: Recommendation) =>
    matchedJobs.filter((item) => item.analysis.recommendation === recommendation).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-8">
          <div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">RolePilot AI</p><Link href="/profiles" className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300">Manage profiles</Link></div>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Job intelligence for focused decisions.</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Review a tailored view of opportunities and the reasoning behind each recommendation.</p>
            </div>
            <div className="w-full sm:w-72">
              <label className="mb-2 block text-sm font-medium" htmlFor="candidate-profile">Candidate profile</label>
              <select id="candidate-profile" value={selectedProfile.id} onChange={(event) => setSelectedProfileId(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200">
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600"><span className="font-medium text-slate-800">Target:</span> {selectedProfile.desiredRoles.join(" · ")}</p>
        </header>

        <section className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="Opportunity overview">
          <Metric label="Total opportunities" value={matchedJobs.length} />
          <Metric label="Recommended" value={recommendationCount("recommended")} tone="text-emerald-800" />
          <Metric label="Worth considering" value={recommendationCount("consider")} tone="text-amber-800" />
          <Metric label="Skipped" value={recommendationCount("skipped")} tone="text-slate-600" />
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="company-summary-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3"><div><h2 id="company-summary-heading" className="text-lg font-semibold">Company monitoring</h2><p className="mt-1 text-sm text-slate-600">Configuration only — job collection is not active yet.</p></div><Link href="/companies" className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300">Manage companies</Link></div>
          {companyError ? <p className="mt-4 text-sm text-red-700">Company configuration unavailable: {companyError}</p> : <dl className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Monitored companies" value={companies.length} /><Metric label="Monitoring enabled" value={companies.filter((company) => company.enabled).length} tone="text-emerald-800" /><Metric label="High priority" value={companies.filter((company) => company.priority === "high").length} tone="text-amber-800" /></dl>}
        </section>

        <section aria-labelledby="opportunities-heading">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="opportunities-heading" className="text-xl font-semibold">Opportunities</h2>
            <p className="text-sm text-slate-500">Mocked job analyses</p>
          </div>
          <div className="space-y-4">
            {matchedJobs.map(({ job, analysis }) => <JobCard key={job.id} job={job} analysis={analysis} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

function EmptyDashboard() {
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6"><p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">RolePilot AI</p><h1 className="mt-3 text-2xl font-semibold">Create your first candidate profile</h1><p className="mt-3 text-slate-600">The dashboard will show opportunities once at least one persisted profile exists.</p><Link href="/profiles" className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4">Manage candidate profiles</Link></div></main>;
}

function Metric({ label, value, tone = "text-slate-900" }: { label: string; value: number; tone?: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p></div>;
}

function JobCard({ job, analysis }: { job: Job; analysis: JobAnalysis }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{job.company}</p>
          <h3 className="mt-1 text-xl font-semibold">{job.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{job.location} · {formatLabel(job.workModel)} · {formatLabel(job.seniority)}</p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span className="text-2xl font-semibold" aria-label={`Match score: ${formatScore(analysis.score)}`}>{formatScore(analysis.score)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationStyles[analysis.recommendation]}`}>{formatLabel(analysis.recommendation)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{analysis.summary}</p>
      <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
        <InsightList title="Key strengths" items={analysis.strengths} />
        <InsightList title="Key gaps" items={[...analysis.gaps, ...analysis.blockingReasons]} muted />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-500">Source: {job.source}</span>
        {job.originalUrl ? <a className="font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300" href={job.originalUrl} target="_blank" rel="noreferrer">View original source</a> : <button type="button" disabled aria-disabled="true" title="Source links are not connected in this mock" className="cursor-not-allowed font-medium text-slate-400">Original source unavailable</button>}
      </div>
    </article>
  );
}

function InsightList({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return <div><h4 className="text-sm font-semibold">{title}</h4><ul className={`mt-2 space-y-1 text-sm ${muted ? "text-slate-600" : "text-slate-700"}`}>{items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">—</span><span>{item}</span></li>)}</ul></div>;
}
