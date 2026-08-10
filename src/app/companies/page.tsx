import Link from 'next/link';

import { CompanyManager } from '@/features/companies/components/company-manager';
import { loadTargetCompanies } from '@/features/companies/server/load-companies';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const result = await loadTargetCompanies();
  if (result.error !== null)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold">Gerenciamento de empresas indisponível</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{result.error}</p>
          <Link
            href="/"
            className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  return <CompanyManager companies={result.companies} />;
}
