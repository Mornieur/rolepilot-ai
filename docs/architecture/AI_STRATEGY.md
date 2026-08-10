# Estratégia de IA

IA é consultiva e posterior a regras. Gemini Developer API gratuita é o runtime; OpenAI foi removido. Não há fallback pago e ChatGPT Plus é irrelevante para API. A quota gratuita pode usar conteúdo para melhorar produtos conforme política do provider; dados são minimizados. Análise manual atual continua elegível-only; override é futuro. Quota esgotada não para coleta, persistência ou filtro. Resultados nunca garantem contratação, inventam fatos ou enviam candidaturas.

Successful validated analyses are persisted as history per profile/job. Each row records provider, actual model, schema version `1`, timestamp, optional returned token usage and latency, and a hash of bounded normalized input. The raw prompt, raw provider response, provider errors, keys, and dollar-cost estimates are never persisted. A changed fingerprint marks the latest saved analysis stale; it remains visible and reanalysis is always an explicit single manual action.

Gemini output is accepted only after JSON parsing, the strict Zod contract, and deterministic-score consistency validation. Invalid output is never persisted or retried automatically; the prior saved analysis remains visible. The JSON Schema mirrors required fields, enums, object closure, numeric bounds, array limits, and string limits from the application contract.
