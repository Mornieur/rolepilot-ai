import { describe, expect, it } from 'vitest';
import { jobDecisionLabels } from './status-presentation';

describe('job decision presentation', () => {
  it('keeps recency separate from the persisted decision state', () => {
    expect(jobDecisionLabels.new).toBe('Sem decisão');
    expect(jobDecisionLabels.saved).toBe('Salva');
    expect(jobDecisionLabels.applied).toBe('Candidatada');
    expect(jobDecisionLabels.ignored).toBe('Ignorada');
    expect(jobDecisionLabels.rejected).toBe('Rejeitada');
  });
});
