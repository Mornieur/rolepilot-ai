'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import {
  createTargetCompanyAction,
  deleteTargetCompanyAction,
  initialCompanyActionState,
  setTargetCompanyEnabledAction,
  type CompanyActionState,
  updateTargetCompanyAction,
} from '@/features/companies/actions';
import type { CompanyPriority, JobSourceProvider, TargetCompany } from '@/types/domain';

const providers: JobSourceProvider[] = ['greenhouse', 'lever'];
const priorities: CompanyPriority[] = ['normal', 'high'];

export function CompanyManager({ companies }: { companies: TargetCompany[] }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Back to dashboard
        </Link>
        <header className="mt-6 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">
            RolePilot AI
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Monitored companies</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Configure public Greenhouse or Lever board identifiers. This does not collect jobs yet.
          </p>
        </header>
        <section className="mt-8" aria-labelledby="create-company">
          <h2 id="create-company" className="text-xl font-semibold">
            Add company
          </h2>
          <CompanyForm action={createTargetCompanyAction} submitLabel="Configure company" />
        </section>
        <section className="mt-10" aria-labelledby="configured-companies">
          <h2 id="configured-companies" className="text-xl font-semibold">
            Configured companies
          </h2>
          {companies.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-slate-600">
              No companies are configured. Add a company before automatic job collection can begin.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CompanyCard({ company }: { company: TargetCompany }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{company.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {company.provider} · {company.boardIdentifier}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge enabled={company.enabled} />
          <PriorityBadge priority={company.priority} />
        </div>
      </div>
      {company.careersUrl && (
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-blue-700 underline underline-offset-4"
        >
          Careers URL
        </a>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <MonitoringForm company={company} />
        {company.provider === 'greenhouse' && company.enabled ? (
          <Link
            href={`/companies/${company.id}/jobs-preview`}
            className="rounded-md border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Preview jobs
          </Link>
        ) : (
          <span className="text-sm text-slate-500">
            {company.provider === 'lever'
              ? 'Lever preview coming later.'
              : 'Enable monitoring to preview jobs.'}
          </span>
        )}
      </div>
      <details className="mt-4 border-t border-slate-100 pt-4">
        <summary className="cursor-pointer text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300">
          Edit configuration
        </summary>
        <CompanyForm
          action={updateTargetCompanyAction}
          submitLabel="Save changes"
          company={company}
        />
        <DeleteCompany id={company.id} />
      </details>
    </article>
  );
}

function CompanyForm({
  action,
  submitLabel,
  company,
}: {
  action: (state: CompanyActionState, formData: FormData) => Promise<CompanyActionState>;
  submitLabel: string;
  company?: TargetCompany;
}) {
  const [state, formAction, pending] = useActionState(action, initialCompanyActionState);
  const [provider, setProvider] = useState<JobSourceProvider>(company?.provider ?? 'greenhouse');
  const values = company ?? emptyCompany;
  const boardHelp =
    provider === 'greenhouse'
      ? 'Greenhouse: use the token in boards.greenhouse.io/<identifier>.'
      : 'Lever: use the identifier in jobs.lever.co/<identifier>.';
  return (
    <form
      action={formAction}
      className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2"
      noValidate
    >
      {company && <input type="hidden" name="id" value={company.id} />}
      <TextField
        name="name"
        label="Company name"
        value={values.name}
        error={state.fieldErrors?.name?.[0]}
        required
      />
      <div>
        <label htmlFor="company-provider" className="block text-sm font-medium">
          Provider
        </label>
        <select
          id="company-provider"
          name="provider"
          value={provider}
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'greenhouse' || value === 'lever') setProvider(value);
          }}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
        >
          {providers.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {state.fieldErrors?.provider?.[0] && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.provider[0]}</p>
        )}
      </div>
      <TextField
        name="boardIdentifier"
        label="Board identifier"
        value={values.boardIdentifier}
        hint={boardHelp}
        error={state.fieldErrors?.boardIdentifier?.[0]}
        required
      />
      <TextField
        name="careersUrl"
        label="Careers URL (optional)"
        value={values.careersUrl ?? ''}
        error={state.fieldErrors?.careersUrl?.[0]}
        type="url"
      />
      <div>
        <label htmlFor="company-priority" className="block text-sm font-medium">
          Priority
        </label>
        <select
          id="company-priority"
          name="priority"
          defaultValue={values.priority}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
        >
          {priorities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <label className="mt-7 flex items-center gap-2 text-sm font-medium">
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={values.enabled}
          className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
        />
        Enable future monitoring
      </label>
      <div className="sm:col-span-2">
        <ActionMessage state={state} />
        <button
          type="submit"
          disabled={pending}
          className="mt-3 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function MonitoringForm({ company }: { company: TargetCompany }) {
  const [state, formAction, pending] = useActionState(
    setTargetCompanyEnabledAction,
    initialCompanyActionState,
  );
  const nextEnabled = !company.enabled;
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={company.id} />
      <input type="hidden" name="enabled" value={String(nextEnabled)} />
      <ActionMessage state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
      >
        {pending ? 'Updating…' : nextEnabled ? 'Enable monitoring' : 'Disable monitoring'}
      </button>
    </form>
  );
}
function DeleteCompany({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    deleteTargetCompanyAction,
    initialCompanyActionState,
  );
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm('Delete this company configuration? This cannot be undone.'))
          event.preventDefault();
      }}
      className="mt-4 border-t border-slate-200 pt-4"
    >
      <input type="hidden" name="id" value={id} />
      <ActionMessage state={state} />
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-60"
      >
        {pending ? 'Deleting…' : 'Delete company'}
      </button>
    </form>
  );
}
function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}
    >
      {enabled ? 'Monitoring enabled' : 'Monitoring disabled'}
    </span>
  );
}
function PriorityBadge({ priority }: { priority: CompanyPriority }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priority === 'high' ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-700'}`}
    >
      {priority} priority
    </span>
  );
}
function TextField({
  name,
  label,
  value,
  hint,
  error,
  required = false,
  type = 'text',
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  const id = `company-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
function ActionMessage({ state }: { state: CompanyActionState }) {
  return state.status === 'idle' ? null : (
    <p
      role="status"
      className={state.status === 'error' ? 'text-sm text-red-700' : 'text-sm text-emerald-700'}
    >
      {state.message}
    </p>
  );
}
const emptyCompany: Omit<TargetCompany, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  provider: 'greenhouse',
  boardIdentifier: '',
  careersUrl: undefined,
  enabled: true,
  priority: 'normal',
};
