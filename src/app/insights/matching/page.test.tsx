import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  user: vi.fn(),
  profiles: vi.fn(),
  diagnostics: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('@/features/auth/server/auth', () => ({ requirePageUser: dependencies.user }));
vi.mock('@/features/profiles/server/load-profiles', () => ({
  loadCandidateProfiles: dependencies.profiles,
}));
vi.mock('@/features/matching-diagnostics/server/load-matching-diagnostics', () => ({
  MatchingDiagnosticsDataError: class MatchingDiagnosticsDataError extends Error {},
  loadMatchingDiagnostics: dependencies.diagnostics,
}));
import MatchingDiagnosticsPage from './page';

const profile = {
  id: 'p1',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
const diagnostics = {
  profile,
  queryCount: 3 as const,
  jobs: { total: 0, active: 0, inactive: 0, eligible: 0, rejected: 0 },
  eligibleRate: 0,
  byCompany: [],
  scoreBuckets: [],
  rejectionReasons: [],
  warnings: [],
  workModels: [],
  seniorities: [],
  topEligible: [],
  borderlineRejected: [],
  falsePositives: [],
  falseNegatives: [],
  decisions: { new: 0, saved: 0, applied: 0, ignored: 0, rejected: 0 },
  decisionComparison: [],
  crossCheck: {},
  qualitySignals: {
    reviewedEligible: 0,
    manuallyInterestingEligibleRate: 0,
    eligibleIgnoredOrRejected: 0,
    rejectedSavedOrApplied: 0,
    titleRejectionShare: 0,
    requiredRejectionShare: 0,
    workModelRejectionShare: 0,
    seniorityWarningShare: 0,
    locationWarningShare: 0,
    partialSkillWarningShare: 0,
  },
};
describe('MatchingDiagnosticsPage', () => {
  beforeEach(() => vi.clearAllMocks());
  it('allows an admin through the server boundary and loads only an authorized selected profile', async () => {
    dependencies.user.mockResolvedValue({ id: 'admin', role: 'admin' });
    dependencies.profiles.mockResolvedValue({ profiles: [profile], error: null });
    dependencies.diagnostics.mockResolvedValue(diagnostics);
    render(await MatchingDiagnosticsPage({ searchParams: Promise.resolve({ profileId: 'p1' }) }));
    expect(screen.getByRole('heading', { name: 'Diagnóstico do matching' })).toBeInTheDocument();
    expect(dependencies.diagnostics).toHaveBeenCalledWith(profile);
  });
  it('denies a normal user before loading profiles or service-role diagnostics', async () => {
    dependencies.user.mockResolvedValue({ id: 'user', role: 'user' });
    dependencies.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
    await expect(MatchingDiagnosticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'redirect',
    );
    expect(dependencies.redirect).toHaveBeenCalledWith('/insights');
    expect(dependencies.profiles).not.toHaveBeenCalled();
    expect(dependencies.diagnostics).not.toHaveBeenCalled();
  });
  it('relies on requirePageUser for unauthenticated redirect and renders a controlled data error', async () => {
    dependencies.user.mockRejectedValue(new Error('login redirect'));
    await expect(MatchingDiagnosticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'login redirect',
    );
    dependencies.user.mockResolvedValue({ id: 'admin', role: 'admin' });
    dependencies.profiles.mockResolvedValue({ profiles: [profile], error: null });
    dependencies.diagnostics.mockRejectedValue(new Error('provider body'));
    render(await MatchingDiagnosticsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'O diagnóstico do matching está indisponível',
    );
  });
});
