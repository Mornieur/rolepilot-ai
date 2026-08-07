import Link from 'next/link';

import { GreenhousePreview } from '@/features/job-sources/greenhouse/components/greenhouse-preview';
import { loadTargetCompanyById } from '@/features/companies/server/load-companies';

export const dynamic = 'force-dynamic';

export default async function JobsPreviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const result = await loadTargetCompanyById(companyId);
  if (result.error !== null || result.company === null)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Job preview unavailable</h1>
          <p className="mt-3 text-slate-600">
            {result.error ?? 'The requested company could not be found.'}
          </p>
          <Link
            href="/companies"
            className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4"
          >
            Back to companies
          </Link>
        </div>
      </main>
    );
  return <GreenhousePreview company={result.company} />;
}
