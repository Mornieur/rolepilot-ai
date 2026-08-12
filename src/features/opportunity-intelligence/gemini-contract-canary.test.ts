import { describe, expect, it } from 'vitest';
import {
  composeProviderCanarySchema,
  geminiContractCanaryCases,
  geminiProviderDossierJsonSchemaWithDefs,
  selectGeminiContractCanaryCases,
} from './gemini-contract-canary';
import {
  findUnsupportedGeminiJsonSchemaKeywords,
  geminiProviderDossierJsonSchema,
  geminiSchemaComplexity,
  opportunityDossierSchema,
} from './schema';

describe('Gemini contract canary composition', () => {
  it('builds progressive, isolated, and bisection schemas from a fixed tiny prompt', () => {
    const summary = geminiContractCanaryCases.find(
      (item) => item.name === 'provider-opportunity-summary',
    );
    const full = geminiContractCanaryCases.find(
      (item) => item.name === 'provider-research-timestamp',
    );
    expect(summary?.contents).toBe('Return valid JSON matching the supplied schema.');
    expect(full?.schema).toEqual(geminiProviderDossierJsonSchema);
    expect(composeProviderCanarySchema(['company']).required).toEqual(['company']);
    expect(selectGeminiContractCanaryCases(['--case', 'provider-company'])).toHaveLength(1);
    expect(() => selectGeminiContractCanaryCases(['--case=missing'])).toThrow(
      'Unknown canary case',
    );
  });

  it('reports safe metrics and recursively allows only the official keyword whitelist', () => {
    for (const testCase of geminiContractCanaryCases.filter((item) => item.schema)) {
      expect(testCase.metrics).toEqual(geminiSchemaComplexity(testCase.schema));
      expect(findUnsupportedGeminiJsonSchemaKeywords(testCase.schema)).toEqual([]);
    }
  });

  it('uses a non-cyclic $defs/$ref alternative without sibling constraints on refs', () => {
    const withDefs = geminiSchemaComplexity(geminiProviderDossierJsonSchemaWithDefs);
    const repeated = geminiSchemaComplexity(geminiProviderDossierJsonSchema);
    expect(geminiProviderDossierJsonSchemaWithDefs.$defs).toBeDefined();
    expect(JSON.stringify(geminiProviderDossierJsonSchemaWithDefs)).toContain(
      '"$ref":"#/$defs/finding"',
    );
    expect(withDefs.serializedBytes).toBeLessThan(repeated.serializedBytes);
  });

  it('does not alter the authoritative domain dossier contract', () => {
    expect(opportunityDossierSchema.shape.compensation.shape.estimatedRange.isNullable()).toBe(
      true,
    );
    expect(opportunityDossierSchema.shape.citations.element.shape.sourceId).toBeDefined();
  });
});
