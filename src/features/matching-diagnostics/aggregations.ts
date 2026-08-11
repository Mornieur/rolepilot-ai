import { evaluateJob, sortEvaluations } from '@/features/job-evaluation/evaluate';
import type { CandidateProfile, JobUserStatus, PersistedJob } from '@/types/domain';
import type { DiagnosticJob, MatchingDiagnostics } from './types';

const explicitStatuses: Exclude<JobUserStatus, 'new'>[] = [
  'saved',
  'applied',
  'ignored',
  'rejected',
];
const labels: Record<string, string> = {
  title: 'Cargo incompatível',
  required: 'Skills obrigatórias insuficientes',
  excluded: 'Skill excluída',
  'work-model': 'Modelo de trabalho incompatível',
  'required-partial': 'Cobertura parcial de skills obrigatórias',
  'seniority-mismatch': 'Senioridade diferente',
  'seniority-unknown': 'Senioridade desconhecida',
  'location-mismatch': 'Localização diferente',
  'location-unknown': 'Localização desconhecida',
  'work-model-unknown': 'Modelo de trabalho desconhecido',
};

const suspiciousPositive =
  /\b(backend|mobile|android|ios|data|security|cyber|product|sales|human resources|recruit|legal|finance|operations)\b/i;
const suspiciousNegative =
  /\b(frontend|front end|react|ui engineer|web engineer|full stack|fullstack|design system|frontend platform|developer experience)\b/i;

function counted(values: string[], denominator?: number) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map]
    .map(([code, count]) => ({
      label: labels[code] ?? code,
      count,
      percentage: denominator ? count / denominator : 0,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}
function bucket(score: number) {
  if (score >= 90) return '90–100';
  if (score >= 80) return '80–89';
  if (score >= 70) return '70–79';
  if (score >= 60) return '60–69';
  if (score >= 50) return '50–59';
  return '<50';
}
function searchable(job: PersistedJob) {
  return [job.title, job.descriptionText, job.location, ...job.departments, ...job.offices]
    .filter(Boolean)
    .join(' ');
}
function warningCodes(evaluation: ReturnType<typeof evaluateJob>) {
  const codes: string[] = [];
  if (evaluation.reasons.some((reason) => reason.code === 'required-partial'))
    codes.push('required-partial');
  if (evaluation.seniorityMatch.matched !== true)
    codes.push(`seniority-${evaluation.seniorityMatch.matched === false ? 'mismatch' : 'unknown'}`);
  if (evaluation.locationMatch.matched !== true)
    codes.push(`location-${evaluation.locationMatch.matched === false ? 'mismatch' : 'unknown'}`);
  if (evaluation.workModelMatch.matched === null) codes.push('work-model-unknown');
  return codes;
}

export function buildMatchingDiagnostics({
  profile,
  jobs,
  companyNames,
  statuses,
}: {
  profile: CandidateProfile;
  jobs: PersistedJob[];
  companyNames: Map<string, string>;
  statuses: Record<string, JobUserStatus>;
}): MatchingDiagnostics {
  const diagnostics = sortEvaluations(jobs.map((job) => evaluateJob(profile, job))).map(
    (evaluation) => {
      const hardReasonCodes = evaluation.reasons
        .filter((reason) => reason.outcome === 'fail')
        .map((reason) => reason.code);
      return {
        ...evaluation,
        companyName: companyNames.get(evaluation.job.targetCompanyId) ?? 'Empresa desconhecida',
        decision: statuses[evaluation.job.id] ?? 'new',
        hardReasonCodes,
        warningCodes: warningCodes(evaluation),
        exactlyOneHardRule: hardReasonCodes.length === 1,
      } satisfies DiagnosticJob;
    },
  );
  const eligible = diagnostics.filter((job) => job.eligible);
  const rejected = diagnostics.filter((job) => !job.eligible);
  const decisions: Record<JobUserStatus, number> = {
    new: 0,
    saved: 0,
    applied: 0,
    ignored: 0,
    rejected: 0,
  };
  for (const job of diagnostics) decisions[job.decision] += 1;
  const reviewedEligible = eligible.filter((job) => job.decision !== 'new');
  const interestingEligible = eligible.filter((job) => ['saved', 'applied'].includes(job.decision));
  const byCompany = [...new Set(diagnostics.map((job) => job.companyName))]
    .map((company) => {
      const subset = diagnostics.filter((job) => job.companyName === company);
      return {
        company,
        eligible: subset.filter((job) => job.eligible).length,
        rejected: subset.filter((job) => !job.eligible).length,
      };
    })
    .sort((left, right) => left.company.localeCompare(right.company));
  return {
    profile,
    queryCount: 3,
    jobs: {
      total: diagnostics.length,
      active: diagnostics.filter((job) => job.job.isActive ?? true).length,
      inactive: diagnostics.filter((job) => !(job.job.isActive ?? true)).length,
      eligible: eligible.length,
      rejected: rejected.length,
    },
    eligibleRate: diagnostics.length ? eligible.length / diagnostics.length : 0,
    byCompany,
    scoreBuckets: ['90–100', '80–89', '70–79', '60–69', '50–59', '<50'].map((label) => ({
      label,
      count: diagnostics.filter((job) => bucket(job.score) === label).length,
    })),
    rejectionReasons: counted(
      rejected.flatMap((job) => job.hardReasonCodes),
      rejected.length,
    ),
    warnings: counted(
      diagnostics.flatMap((job) => job.warningCodes),
      diagnostics.length,
    ),
    workModels: counted(
      diagnostics.flatMap((job) =>
        job.workModelMatch.detectedModels.length ? job.workModelMatch.detectedModels : ['unknown'],
      ),
    ),
    seniorities: counted(
      diagnostics.flatMap((job) =>
        job.seniorityMatch.detectedSeniorities.length
          ? job.seniorityMatch.detectedSeniorities
          : ['unknown'],
      ),
    ),
    topEligible: eligible.slice(0, 20),
    borderlineRejected: rejected.slice(0, 30),
    falsePositives: eligible.filter((job) => suspiciousPositive.test(searchable(job.job))),
    falseNegatives: rejected.filter((job) => suspiciousNegative.test(searchable(job.job))),
    decisions,
    decisionComparison: explicitStatuses.map((decision) => {
      const subset = diagnostics.filter((job) => job.decision === decision);
      return {
        decision,
        count: subset.length,
        eligible: subset.filter((job) => job.eligible).length,
        rejected: subset.filter((job) => !job.eligible).length,
        averageScore: subset.length
          ? subset.reduce((total, job) => total + job.score, 0) / subset.length
          : null,
      };
    }),
    crossCheck: {
      'eligible-saved': eligible.filter((job) => job.decision === 'saved').length,
      'eligible-applied': eligible.filter((job) => job.decision === 'applied').length,
      'eligible-ignored': eligible.filter((job) => job.decision === 'ignored').length,
      'eligible-rejected': eligible.filter((job) => job.decision === 'rejected').length,
      'rejected-saved': rejected.filter((job) => job.decision === 'saved').length,
      'rejected-applied': rejected.filter((job) => job.decision === 'applied').length,
    },
    qualitySignals: {
      reviewedEligible: reviewedEligible.length,
      manuallyInterestingEligibleRate: reviewedEligible.length
        ? interestingEligible.length / reviewedEligible.length
        : 0,
      eligibleIgnoredOrRejected: eligible.filter((job) =>
        ['ignored', 'rejected'].includes(job.decision),
      ).length,
      rejectedSavedOrApplied: rejected.filter((job) => ['saved', 'applied'].includes(job.decision))
        .length,
      titleRejectionShare: rejected.length
        ? rejected.filter((job) => job.hardReasonCodes.includes('title')).length / rejected.length
        : 0,
      requiredRejectionShare: rejected.length
        ? rejected.filter((job) => job.hardReasonCodes.includes('required')).length /
          rejected.length
        : 0,
      workModelRejectionShare: rejected.length
        ? rejected.filter((job) => job.hardReasonCodes.includes('work-model')).length /
          rejected.length
        : 0,
      seniorityWarningShare: diagnostics.length
        ? diagnostics.filter((job) => job.warningCodes.includes('seniority-mismatch')).length /
          diagnostics.length
        : 0,
      locationWarningShare: diagnostics.length
        ? diagnostics.filter((job) => job.warningCodes.includes('location-mismatch')).length /
          diagnostics.length
        : 0,
      partialSkillWarningShare: diagnostics.length
        ? diagnostics.filter((job) => job.warningCodes.includes('required-partial')).length /
          diagnostics.length
        : 0,
    },
  };
}
