import Link from 'next/link';

import { Alert, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent } from '@/components/page-layout';
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
      <PageContainer>
        <PageContent>
          <Surface className="mx-auto max-w-xl p-6">
            <Alert variant="danger" title="Prévia de vagas indisponível">
              {result.error ?? 'A empresa solicitada não foi encontrada.'}
            </Alert>
            <Link
              href="/companies"
              className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4"
            >
              Voltar às empresas
            </Link>
          </Surface>
        </PageContent>
      </PageContainer>
    );
  return <GreenhousePreview company={result.company} />;
}
