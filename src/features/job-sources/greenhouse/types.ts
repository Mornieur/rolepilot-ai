export type ExternalJobPreview = {
  externalId: string;
  provider: "greenhouse";
  companyId: string;
  companyName: string;
  title: string;
  location: string | null;
  descriptionText: string | null;
  originalUrl: string;
  sourceUpdatedAt: string | null;
  language: string | null;
  departments: string[];
  offices: string[];
};

export type GreenhousePreviewResult = {
  jobs: ExternalJobPreview[];
  total: number;
  skippedJobs: number;
};
