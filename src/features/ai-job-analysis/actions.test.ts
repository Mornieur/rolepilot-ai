import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({ generate: vi.fn(), persist: vi.fn() }));
vi.mock('@/features/ai-job-analysis/analyze-job', () => ({
  generateEligibleJobAnalysis: dependencies.generate,
}));
vi.mock('@/features/ai-job-analysis/server/job-ai-analyses', () => ({
  JobAiAnalysisDataError: class JobAiAnalysisDataError extends Error {},
  persistSuccessfulAiAnalysis: dependencies.persist,
}));
import { analyzeJobAction } from './actions';
import { initialAiAnalysisActionState } from './action-state';

const form = () => new FormData();
describe('AI analysis action persistence flow', () => {
  beforeEach(() => {
    dependencies.generate.mockReset().mockResolvedValue({
      profileId: '11111111-1111-4111-8111-111111111111',
      jobId: '22222222-2222-4222-8222-222222222222',
    });
    dependencies.persist.mockReset().mockResolvedValue({ id: 'analysis' });
  });
  it('generates once then persists once', async () => {
    const data = form();
    data.set('profileId', '11111111-1111-4111-8111-111111111111');
    data.set('jobId', '22222222-2222-4222-8222-222222222222');
    await expect(analyzeJobAction(initialAiAnalysisActionState, data)).resolves.toMatchObject({
      status: 'success',
    });
    expect(dependencies.generate).toHaveBeenCalledOnce();
    expect(dependencies.persist).toHaveBeenCalledOnce();
  });
  it('does not generate a second provider request when persistence fails', async () => {
    dependencies.persist.mockRejectedValue(new Error('database error'));
    const data = form();
    data.set('profileId', '11111111-1111-4111-8111-111111111111');
    data.set('jobId', '22222222-2222-4222-8222-222222222222');
    await expect(analyzeJobAction(initialAiAnalysisActionState, data)).resolves.toMatchObject({
      status: 'error',
    });
    expect(dependencies.generate).toHaveBeenCalledOnce();
    expect(dependencies.persist).toHaveBeenCalledOnce();
  });
});
