import 'server-only';
import { listTargetCompanies } from '@/features/companies/server/target-companies';
import { fetchGreenhouseJobs } from '@/features/job-sources/greenhouse/client';
import { GreenhouseError } from '@/features/job-sources/greenhouse/errors';
import { persistCollectedJobs } from '@/features/jobs/server/persisted-jobs';
import {
  finishCollectionRun,
  startCollectionRun,
} from '@/features/job-collection/server/collection-runs';
import type {
  CollectionRunResult,
  CollectionTrigger,
  CompanyCollectionResult,
} from '@/features/job-collection/types';

const empty = (trigger: CollectionTrigger, startedAt: string): CollectionRunResult => ({
  trigger,
  status: 'success',
  startedAt,
  finishedAt: startedAt,
  companiesAttempted: 0,
  companiesSucceeded: 0,
  companiesFailed: 0,
  discovered: 0,
  created: 0,
  updated: 0,
  unchanged: 0,
  malformed: 0,
  skipped: 0,
  companies: [],
});
const category = (error: unknown): CompanyCollectionResult['errorCategory'] =>
  error instanceof GreenhouseError
    ? error.code === 'timeout'
      ? 'timeout'
      : error.code === 'invalid-response'
        ? 'invalid-response'
        : 'unavailable'
    : 'persistence';

export async function runCollection(
  trigger: CollectionTrigger,
  companyId?: string,
): Promise<CollectionRunResult> {
  const startedAt = new Date().toISOString();
  const row = await startCollectionRun(trigger);
  const result = empty(trigger, startedAt);
  result.id = row.id;
  try {
    const companies = (await listTargetCompanies()).filter(
      (company) => company.enabled && (!companyId || company.id === companyId),
    );
    for (const company of companies) {
      if (company.provider !== 'greenhouse') {
        result.skipped += 1;
        result.companies.push({
          companyId: company.id,
          companyName: company.name,
          provider: company.provider,
          status: 'skipped',
          discovered: 0,
          created: 0,
          updated: 0,
          unchanged: 0,
          malformed: 0,
          skipped: 1,
          errorCategory: 'unsupported',
        });
        continue;
      }
      result.companiesAttempted += 1;
      try {
        const preview = await fetchGreenhouseJobs(company);
        const saved = await persistCollectedJobs(
          company.id,
          preview.jobs,
          preview.skippedJobs,
          startedAt,
        );
        const companyResult: CompanyCollectionResult = {
          companyId: company.id,
          companyName: company.name,
          provider: company.provider,
          status: 'success',
          discovered: saved.discovered,
          created: saved.created,
          updated: saved.updated,
          unchanged: saved.unchanged,
          malformed: saved.malformed,
          skipped: saved.skipped,
        };
        result.companies.push(companyResult);
        result.companiesSucceeded += 1;
        for (const key of [
          'discovered',
          'created',
          'updated',
          'unchanged',
          'malformed',
          'skipped',
        ] as const)
          result[key] += companyResult[key];
      } catch (error) {
        result.companiesFailed += 1;
        result.companies.push({
          companyId: company.id,
          companyName: company.name,
          provider: company.provider,
          status: 'failed',
          discovered: 0,
          created: 0,
          updated: 0,
          unchanged: 0,
          malformed: 0,
          skipped: 0,
          errorCategory: category(error),
        });
      }
    }
    result.status =
      result.companiesFailed === 0 ? 'success' : result.companiesSucceeded ? 'partial' : 'failed';
  } catch {
    result.status = 'failed';
  }
  result.finishedAt = new Date().toISOString();
  await finishCollectionRun(row.id, result);
  return result;
}
