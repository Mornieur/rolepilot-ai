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

const frontendSignals = ['frontend', 'front end', 'react', 'ui', 'web'];
const adjacentEngineeringTitles = [
  'software engineer',
  'full stack',
  'fullstack',
  'web engineer',
  'ui engineer',
];
const clearlyDistantTitles = [
  'backend',
  'data engineer',
  'cyber',
  'security',
  'android',
  'ios',
  'mobile',
  'product manager',
  'sales',
  'human resources',
  'recruit',
];

function matchDesiredRole(title: string, searchable: string, desiredRoles: string[]) {
  const literal = terms(title, desiredRoles);
  const profileTargetsFrontend = unique(desiredRoles).some((role) =>
    frontendSignals.some((signal) => role.includes(signal)),
  );
  const specificLiteral = literal.filter((term) => !adjacentEngineeringTitles.includes(term));
  if (specificLiteral.length || !profileTargetsFrontend) return specificLiteral;
  const titleIsDistant = clearlyDistantTitles.some((term) => includesTerm(title, term));
  const titleIsAdjacent = adjacentEngineeringTitles.some((term) => includesTerm(title, term));
  const hasFrontendEvidence = frontendSignals.some((term) => includesTerm(searchable, term));
  return !titleIsDistant &&
    (frontendSignals.some((term) => includesTerm(title, term)) ||
      (titleIsAdjacent && hasFrontendEvidence))
    ? ['adjacent frontend role']
    : [];
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
  const titleTerms = matchDesiredRole(title, searchable, profile.desiredRoles);
  const detectedSeniorities = detectSeniorities(title);
  const detectedModels = detectModels(searchable, job.location, job.offices);
  const locationTerms = job.location
    ? terms(normalizeText([job.location, ...job.offices].join(' ')), profile.locations)
    : [];

  const requiredTotal = unique(profile.requiredSkills).length;
  const requiredCoverage = requiredTotal ? required.length / requiredTotal : 1;
  const requiredOk = requiredCoverage >= 0.5;
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
    reasons.push({
      code: 'title',
      outcome: 'pass',
      message: 'Cargo-alvo ou papel adjacente compatível.',
    });
  } else reasons.push({ code: 'title', outcome: 'fail', message: 'Cargo distante do perfil.' });
  if (requiredOk) {
    score += profile.requiredSkills.length ? 35 : 0;
    reasons.push({
      code: 'required',
      outcome: 'pass',
      message: `Cobertura de skills obrigatórias: ${required.length}/${requiredTotal}.`,
    });
  } else
    reasons.push({
      code: 'required',
      outcome: 'fail',
      message: 'Cobertura mínima de skills obrigatórias não atingida.',
    });
  if (preferred.length) {
    score += Math.min(15, preferred.length * 5);
    reasons.push({ code: 'preferred', outcome: 'pass', message: 'Skills desejáveis encontradas.' });
  }
  if (requiredOk && requiredCoverage < 1)
    reasons.push({
      code: 'required-partial',
      outcome: 'neutral',
      message: 'Uma skill obrigatória não foi encontrada; verifique manualmente.',
    });
  if (!excludedOk) {
    score -= 40;
    reasons.push({ code: 'excluded', outcome: 'fail', message: 'An excluded keyword matched.' });
  }
  for (const [code, value, label] of [
    ['seniority', seniorityOk, 'Senioridade'],
    ['location', locationOk, 'Localização'],
    ['work-model', workModelOk, 'Modelo de trabalho'],
  ] as const) {
    if (value === true) {
      score += 10;
      reasons.push({ code, outcome: 'pass', message: `${label} compatível.` });
    } else if (value === false) {
      score -= 10;
      reasons.push({
        code,
        outcome: code === 'work-model' ? 'fail' : 'neutral',
        message:
          code === 'work-model'
            ? 'Modelo de trabalho incompatível com o perfil.'
            : `${label} diferente; revise manualmente.`,
      });
    } else
      reasons.push({
        code,
        outcome: 'neutral',
        message: `${label} desconhecido ou sem restrição.`,
      });
  }

  const eligible = requiredOk && titleOk && excludedOk && workModelOk !== false;
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
