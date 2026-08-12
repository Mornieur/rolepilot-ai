export type OpportunityResearchActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};
export const initialOpportunityResearchActionState: OpportunityResearchActionState = {
  status: 'idle',
};
