import { describe, expect, it } from 'vitest';
import { canAccessProfile } from './policy';

describe('ownership policy', () => {
  const maria = { id: '11111111-1111-4111-8111-111111111111', role: 'user' as const };
  const flavia = { id: '22222222-2222-4222-8222-222222222222', role: 'user' as const };
  const admin = { id: '33333333-3333-4333-8333-333333333333', role: 'admin' as const };
  it('allows a normal user only on their own profile-derived records', () => {
    expect(canAccessProfile(maria, maria.id)).toBe(true);
    expect(canAccessProfile(maria, flavia.id)).toBe(false);
    expect(canAccessProfile(maria, null)).toBe(false);
  });
  it('recognizes the persisted admin role without email inference', () => {
    expect(canAccessProfile(flavia, maria.id)).toBe(false);
    expect(canAccessProfile(admin, maria.id)).toBe(true);
    expect(canAccessProfile(admin, flavia.id)).toBe(true);
  });
});
