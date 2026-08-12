import { GoogleGenAI } from '@google/genai';
import { selectGeminiContractCanaryCases } from '../src/features/opportunity-intelligence/gemini-contract-canary.ts';

const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY is missing.');

const cases = selectGeminiContractCanaryCases(process.argv.slice(2));

function metadata(error: unknown) {
  const status =
    typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined;
  let providerStatus: string | undefined;
  let providerReason: string | undefined;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    try {
      const provider = JSON.parse(error.message).error as
        { status?: unknown; details?: unknown[] } | undefined;
      providerStatus = typeof provider?.status === 'string' ? provider.status : undefined;
      providerReason = provider?.details
        ?.map((x) =>
          x && typeof x === 'object' && 'reason' in x && typeof x.reason === 'string'
            ? x.reason
            : undefined,
        )
        .find(Boolean);
    } catch {
      /* deliberately avoid provider response bodies */
    }
  }
  return { status, providerStatus, providerReason };
}

const client = new GoogleGenAI({ apiKey: key });
for (const testCase of cases) {
  const started = Date.now();
  try {
    await client.models.generateContent({
      model,
      contents: testCase.contents,
      config: testCase.schema
        ? {
            responseMimeType: 'application/json',
            responseJsonSchema: testCase.schema,
            abortSignal: AbortSignal.timeout(30_000),
          }
        : { abortSignal: AbortSignal.timeout(30_000) },
    });
    console.log(
      JSON.stringify({
        case: testCase.name,
        model,
        schemaBytes: testCase.metrics?.serializedBytes ?? 0,
        schemaDepth: testCase.metrics?.maxDepth ?? 0,
        propertyCount: testCase.metrics?.propertyCount ?? 0,
        requiredCount: testCase.metrics?.requiredFieldCount ?? 0,
        arrayCount: testCase.metrics?.arraySchemaCount ?? 0,
        enumCount: testCase.metrics?.enumCount ?? 0,
        success: true,
        httpStatus: null,
        providerStatus: null,
        providerReason: null,
        latencyMs: Date.now() - started,
      }),
    );
  } catch (error) {
    const details = metadata(error);
    console.log(
      JSON.stringify({
        case: testCase.name,
        model,
        schemaBytes: testCase.metrics?.serializedBytes ?? 0,
        schemaDepth: testCase.metrics?.maxDepth ?? 0,
        propertyCount: testCase.metrics?.propertyCount ?? 0,
        requiredCount: testCase.metrics?.requiredFieldCount ?? 0,
        arrayCount: testCase.metrics?.arraySchemaCount ?? 0,
        enumCount: testCase.metrics?.enumCount ?? 0,
        success: false,
        httpStatus: details.status ?? null,
        providerStatus: details.providerStatus ?? null,
        providerReason: details.providerReason ?? null,
        latencyMs: Date.now() - started,
      }),
    );
  }
}
