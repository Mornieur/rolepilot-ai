export type CompanyActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCompanyActionState: CompanyActionState = { status: 'idle' };
