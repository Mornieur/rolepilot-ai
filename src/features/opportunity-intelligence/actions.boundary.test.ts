import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Opportunity Intelligence Server Action boundary', () => {
  it('exports only the async action and logs only safe failure classifications', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/opportunity-intelligence/actions.ts'),
      'utf8',
    );
    expect(source).toContain("'use server'");
    expect(source).toMatch(/export async function researchOpportunityAction/);
    expect(source).toContain('stage=server_action classification=${classification}');
    expect(source).not.toContain('TAVILY_API_KEY');
    expect(source).not.toContain('formData.toString');
  });
});
