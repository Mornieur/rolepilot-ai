import type { CandidateProfile, PersistedJob, Seniority, WorkModel } from '@/types/domain';
import type { DeterministicJobEvaluation, EvaluationReason } from '@/features/job-evaluation/types';

export function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}#+]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const unique = (values: string[]) => [...new Set(values.map(normalizeText).filter(Boolean))];

function includesTerm(text: string, term: string) {
  const normalized = normalizeText(term);
  return normalized
    ? new RegExp(`(^|\\s)${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`).test(text)
    : false;
}

function terms(text: string, values: string[]) {
  return unique(values).filter((term) => includesTerm(text, term));
}

const seniorityPatterns: [Seniority, RegExp][] = [
  ['junior', /\b(intern|internship|trainee|junior|jr)\b/],
  ['mid', /\b(mid level|mid|pleno)\b/],
  ['senior', /\b(senior|sr)\b/],
  ['staff', /\b(staff|principal|lead|tech lead|manager|head|director)\b/],
];

function detectSeniorities(title: string) {
  return seniorityPatterns.filter(([, pattern]) => pattern.test(title)).map(([level]) => level);
}

function detectModels(text: string, location: string | null, offices: string[]): WorkModel[] {
  const result: WorkModel[] = [];
  const locationText = normalizeText([location, ...offices].filter(Boolean).join(' '));

  if (
    /\b(remote|remoto)\s+(role|position|work|trabalho|opportunity|job|vaga)\b|\b(fully|100)\s+(remote|remoto)\b|\b(work|working)\s+(remote|remotely)\b/.test(
      text,
    ) ||
    /\b(remote|remoto)\b/.test(locationText)
  )
    result.push('remote');
  if (/\b(hybrid|hibrido)\b/.test(text) || /\b(hybrid|hibrido)\b/.test(locationText))
    result.push('hybrid');
  if (
    /\b(on site|onsite|presencial)\b/.test(text) ||
    /\b(on site|onsite|presencial)\b/.test(locationText)
  )
    result.push('on-site');

  return result;
}

export function evaluateJob(
  profile: CandidateProfile,
  job: PersistedJob,
): DeterministicJobEvaluation {
  const title = normalizeText(job.title);
  const searchable = normalizeText(
    [job.title, job.descriptionText, job.location, ...job.departments, ...job.offices]
      .filter(Boolean)
      .join(' '),
  );
  const reasons: EvaluationReason[] = [];
  let score = 0;

  const required = terms(searchable, profile.requiredSkills);
  const preferred = terms(searchable, profile.preferredSkills);
  const excluded = terms(searchable, profile.excludedSkills);
  const titleTerms = terms(title, profile.desiredRoles);
  const detectedSeniorities = detectSeniorities(title);
  const detectedModels = detectModels(searchable, job.location, job.offices);
  const locationTerms = job.location
    ? terms(normalizeText([job.location, ...job.offices].join(' ')), profile.locations)
    : [];

  const requiredOk =
    profile.requiredSkills.length === 0 ||
    required.length === unique(profile.requiredSkills).length;
  const titleOk = profile.desiredRoles.length === 0 || titleTerms.length > 0;
  const excludedOk = excluded.length === 0;
  const seniorityOk =
    detectedSeniorities.length === 0
      ? null
      : detectedSeniorities.some((level) => profile.acceptedSeniorities.includes(level));
  const locationOk =
    !job.location || profile.locations.length === 0 ? null : locationTerms.length > 0;
  const workModelOk =
    detectedModels.length === 0 || profile.acceptedWorkModels.length === 0
      ? null
      : detectedModels.some((model) => profile.acceptedWorkModels.includes(model));

  if (titleOk) {
    score += profile.desiredRoles.length ? 25 : 0;
    reasons.push({ code: 'title', outcome: 'pass', message: 'Target title matched.' });
  } else reasons.push({ code: 'title', outcome: 'fail', message: 'No target title matched.' });
  if (requiredOk) {
    score += profile.requiredSkills.length ? 35 : 0;
    reasons.push({ code: 'required', outcome: 'pass', message: 'Required keywords matched.' });
  } else
    reasons.push({
      code: 'required',
      outcome: 'fail',
      message: 'One or more required keywords are missing.',
    });
  if (preferred.length) {
    score += Math.min(15, preferred.length * 5);
    reasons.push({ code: 'preferred', outcome: 'pass', message: 'Preferred keywords matched.' });
  }
  if (!excludedOk) {
    score -= 40;
    reasons.push({ code: 'excluded', outcome: 'fail', message: 'An excluded keyword matched.' });
  }
  for (const [code, value, label] of [
    ['seniority', seniorityOk, 'Seniority'],
    ['location', locationOk, 'Location'],
    ['work-model', workModelOk, 'Work model'],
  ] as const) {
    if (value === true) {
      score += 10;
      reasons.push({ code, outcome: 'pass', message: `${label} is accepted.` });
    } else if (value === false) {
      score -= 20;
      reasons.push({ code, outcome: 'fail', message: `${label} is incompatible.` });
    } else
      reasons.push({ code, outcome: 'neutral', message: `${label} is unknown or unrestricted.` });
  }

  const eligible =
    requiredOk &&
    titleOk &&
    excludedOk &&
    seniorityOk !== false &&
    locationOk !== false &&
    workModelOk !== false;
  return {
    job,
    profileId: profile.id,
    eligible,
    status: eligible ? 'eligible' : 'rejected',
    evaluatedAt: new Date().toISOString(),
    score: Math.max(0, Math.min(100, score)),
    reasons,
    matchedKeywords: [...new Set([...required, ...preferred])],
    matchedRequiredKeywords: required,
    matchedPreferredKeywords: preferred,
    excludedKeywordMatches: excluded,
    titleMatch: {
      matched: profile.desiredRoles.length ? titleTerms.length > 0 : null,
      matchedTerms: titleTerms,
    },
    seniorityMatch: { matched: seniorityOk, detectedSeniorities },
    locationMatch: { matched: locationOk, matchedTerms: locationTerms },
    workModelMatch: { matched: workModelOk, detectedModels },
  };
}

export function sortEvaluations(results: DeterministicJobEvaluation[]) {
  return [...results].sort(
    (a, b) =>
      Number(b.eligible) - Number(a.eligible) ||
      b.score - a.score ||
      b.job.lastSeenAt.localeCompare(a.job.lastSeenAt) ||
      a.job.title.localeCompare(b.job.title) ||
      a.job.id.localeCompare(b.job.id),
  );
}
