import { describe, expect, it } from 'vitest';

import { isPersonalAccessAuthorized, personalAccessChallenge } from './personal-access';

const authorizationFor = (secret: string) =>
  `Basic ${Buffer.from(`rolepilot:${secret}`).toString('base64')}`;

describe('personal MVP access gate', () => {
  it('rejects anonymous and incorrect credentials', () => {
    expect(isPersonalAccessAuthorized(null, 'test-secret')).toBe(false);
    expect(isPersonalAccessAuthorized('Basic invalid', 'test-secret')).toBe(false);
    expect(isPersonalAccessAuthorized(authorizationFor('wrong'), 'test-secret')).toBe(false);
  });

  it('accepts only the configured server-side credential', () => {
    expect(isPersonalAccessAuthorized(authorizationFor('test-secret'), 'test-secret')).toBe(true);
    expect(personalAccessChallenge()).toContain('Basic realm=');
  });
});
