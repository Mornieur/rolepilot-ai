'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import {
  createCandidateProfileAction,
  deleteCandidateProfileAction,
  updateCandidateProfileAction,
} from '@/features/profiles/actions';
import {
  initialProfileActionState,
  type ProfileActionState,
} from '@/features/profiles/action-state';
import { canDeleteCandidateProfile } from '@/features/profiles/profile-policy';
import type { CandidateProfile, Seniority, WorkModel } from '@/types/domain';
import { Surface } from '@feitoza-ui/core';

type ProfileManagerProps = { profiles: CandidateProfile[] };
const seniorityOptions: Seniority[] = ['junior', 'mid', 'senior', 'staff'];
const workModelOptions: WorkModel[] = ['remote', 'hybrid', 'on-site'];

export function ProfileManager({ profiles }: ProfileManagerProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8">
      <Surface className="mx-auto max-w-4xl p-5 sm:p-6">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:text-cyan-300 dark:focus:ring-cyan-400"
        >
          Back to dashboard
        </Link>
        <header className="mt-6 border-b border-slate-200 pb-6 dark:border-slate-700">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-cyan-300">
            RolePilot AI
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Candidate profiles</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Profiles are stored in Supabase. Enter list values as comma-separated text.
          </p>
        </header>
        <section className="mt-8" aria-labelledby="create-profile">
          <h2 id="create-profile" className="text-xl font-semibold">
            Create profile
          </h2>
          <ProfileForm action={createCandidateProfileAction} submitLabel="Create profile" />
        </section>
        <section className="mt-10" aria-labelledby="saved-profiles">
          <h2 id="saved-profiles" className="text-xl font-semibold">
            Saved profiles
          </h2>
          {profiles.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No profiles yet. Create the first profile above to use the dashboard.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} totalProfiles={profiles.length} />
              ))}
            </div>
          )}
        </section>
      </Surface>
    </main>
  );
}

function ProfileCard({
  profile,
  totalProfiles,
}: {
  profile: CandidateProfile;
  totalProfiles: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <details>
        <summary className="cursor-pointer text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-cyan-400">
          {profile.name}
        </summary>
        <div className="mt-5">
          <ProfileForm
            action={updateCandidateProfileAction}
            submitLabel="Save changes"
            profile={profile}
          />
          <DeleteProfile id={profile.id} disabled={!canDeleteCandidateProfile(totalProfiles)} />
        </div>
      </details>
    </article>
  );
}

function ProfileForm({
  action,
  submitLabel,
  profile,
}: {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  submitLabel: string;
  profile?: CandidateProfile;
}) {
  const [state, formAction, pending] = useActionState(action, initialProfileActionState);
  const values = profile ?? emptyProfile;
  return (
    <form
      action={formAction}
      className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2"
      noValidate
    >
      {profile && <input type="hidden" name="id" value={profile.id} />}
      <TextField
        name="name"
        label="Profile name"
        value={values.name}
        error={state.fieldErrors?.name?.[0]}
        required
      />
      <TextField
        name="desiredRoles"
        label="Desired roles"
        value={values.desiredRoles.join(', ')}
        error={state.fieldErrors?.desiredRoles?.[0]}
        hint="Example: Frontend Engineer, React Engineer"
        required
      />
      <CheckGroup
        name="acceptedSeniorities"
        label="Accepted seniorities"
        options={seniorityOptions}
        selected={values.acceptedSeniorities}
        error={state.fieldErrors?.acceptedSeniorities?.[0]}
      />
      <CheckGroup
        name="acceptedWorkModels"
        label="Accepted work models"
        options={workModelOptions}
        selected={values.acceptedWorkModels}
        error={state.fieldErrors?.acceptedWorkModels?.[0]}
      />
      <TextField
        name="requiredSkills"
        label="Required skills"
        value={values.requiredSkills.join(', ')}
        error={state.fieldErrors?.requiredSkills?.[0]}
        required
      />
      <TextField
        name="preferredSkills"
        label="Preferred skills"
        value={values.preferredSkills.join(', ')}
        error={state.fieldErrors?.preferredSkills?.[0]}
      />
      <TextField
        name="excludedSkills"
        label="Excluded skills"
        value={values.excludedSkills.join(', ')}
        error={state.fieldErrors?.excludedSkills?.[0]}
      />
      <TextField
        name="locations"
        label="Locations"
        value={values.locations.join(', ')}
        error={state.fieldErrors?.locations?.[0]}
        required
      />
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

function DeleteProfile({ id, disabled }: { id: string; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    deleteCandidateProfileAction,
    initialProfileActionState,
  );
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!disabled && !window.confirm('Delete this candidate profile? This cannot be undone.'))
          event.preventDefault();
      }}
      className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700"
    >
      <input type="hidden" name="id" value={id} />
      <ActionMessage state={state} />
      <button
        type="submit"
        disabled={disabled || pending}
        title={disabled ? 'At least one candidate profile must remain.' : undefined}
        className="mt-2 rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-red-800 dark:text-red-300 dark:focus:ring-red-800 dark:disabled:border-slate-700"
      >
        {pending ? 'Deleting…' : 'Delete profile'}
      </button>
      {disabled && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          At least one candidate profile must remain.
        </p>
      )}
    </form>
  );
}

function TextField({
  name,
  label,
  value,
  hint,
  error,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const id = `profile-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <input
        id={id}
        name={name}
        defaultValue={value}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-900"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function CheckGroup<T extends string>({
  name,
  label,
  options,
  selected,
  error,
}: {
  name: string;
  label: string;
  options: T[];
  selected: T[];
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              name={name}
              type="checkbox"
              value={option}
              defaultChecked={selected.includes(option)}
              className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300 dark:border-slate-600 dark:focus:ring-cyan-400"
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </fieldset>
  );
}

function ActionMessage({ state }: { state: ProfileActionState }) {
  return state.status === 'idle' ? null : (
    <p
      role="status"
      className={
        state.status === 'error'
          ? 'text-sm text-red-700 dark:text-red-300'
          : 'text-sm text-emerald-700 dark:text-emerald-300'
      }
    >
      {state.message}
    </p>
  );
}

const emptyProfile: Omit<CandidateProfile, 'id'> = {
  name: '',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
