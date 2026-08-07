import { describe, expect, it } from 'vitest';

import { targetCompanyDatabaseMessage } from './company-errors';

describe('target company database errors', () => {
  it('returns a safe duplicate provider and board identifier message', () => {
    expect(targetCompanyDatabaseMessage(true)).toBe(
      'This provider and board identifier are already configured.',
    );
    expect(targetCompanyDatabaseMessage(false)).toBe(
      'Target companies are unavailable right now. Please try again.',
    );
  });
});
