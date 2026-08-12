import 'server-only';
import type { DossierEvidenceClass } from '@/features/opportunity-intelligence/types';
import type { ResearchSearchResult } from './provider';
const official =
  /(^|\.)(careers\.|engineering\.)?(amazon|google|meta|microsoft|apple|netflix|linkedin|github|stripe|nubank|mercadolivre)\.|investor|ir\.|careers\.|engineering\.|newsroom\.|press\./i;
const community = /glassdoor|blind|reddit|teamblind|fishbowl|levels\.fyi/i;
const career = /levels\.fyi|glassdoor|indeed|leetcode|interviewing\.io/i;
export function sourceClassification(source: Pick<ResearchSearchResult, 'domain'>): {
  tier: 1 | 2 | 3;
  sourceKind: string;
  evidenceClassification: DossierEvidenceClass;
} {
  if (official.test(source.domain))
    return { tier: 1, sourceKind: 'official', evidenceClassification: 'known' };
  if (community.test(source.domain))
    return {
      tier: 3,
      sourceKind: career.test(source.domain) ? 'career_platform' : 'community',
      evidenceClassification: 'anecdotal',
    };
  return { tier: 2, sourceKind: 'press', evidenceClassification: 'likely' };
}
export function sanitizeEvidenceText(value: string, max = 6000) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
export function selectResearchSources(results: ResearchSearchResult[], max = 10) {
  const unique = new Map<string, ResearchSearchResult>();
  for (const result of results) if (!unique.has(result.url)) unique.set(result.url, result);
  return [...unique.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, max);
}
