# Opportunity Intelligence V1

The canonical opportunity detail page is a decision and preparation workspace. Deterministic matching remains authoritative for eligibility, score and priority. Tavily retrieves bounded external evidence once; Gemini performs Company Intelligence then Candidate/Application Intelligence, and cannot change matching, decisions or notifications.

## Retrieval and cost bounds

An explicit user action performs at most six Tavily Search calls, selects at most ten sources and extracts at most four sources only when the search snippet is insufficient. There is no Tavily Research call, recursive follow-up, page-load research, collection research or Telegram research. One newly researched dossier uses two bounded sequential Gemini calls; a fresh cached dossier uses zero. A failure in either synthesis never persists a partial completed dossier.

## Evidence and uncertainty

Sources are Tier 1 official/filing/careers material, Tier 2 established press, compensation or career platforms, or Tier 3 community reports. Tier 3 is always anecdotal. Claims use `known`, `likely`, `anecdotal` or `unknown`; incompatible salary units, geographies and compensation components are retained as conflicts rather than averaged. URLs in the dossier come only from normalized Tavily records.

## Freshness, privacy and safety

Job/profile/schema/strategy changes invalidate the fingerprint. Fundamentals have a 90-day policy, compensation and hiring process 45 days, and current-company moment 14 days. V1 uses a conservative 14-day overall dossier expiry. Gemini receives only bounded job/profile matching context and sanitized source excerpts; it receives no credentials, auth data, raw HTML or raw provider body. Web pages are untrusted data, never instructions.

`opportunity_research_dossiers` stores validated structured results; `opportunity_research_sources` stores citations and bounded excerpts, never prompts, raw HTML, provider responses, keys or error bodies. Source access inherits dossier/profile ownership. `TAVILY_API_KEY` is server-only.

## Current polish and known limitations

Opportunity Intelligence V1 is functional end-to-end in production: a completed dossier persists, reloads read-only, and renders company intelligence, compensation, hiring context, preparation, and citations. User-facing generated content is requested in concise pt-BR, while established technical, company, product, and source names remain unchanged when natural. The interface localizes internal evidence, confidence, decision, and source-tier states without changing persisted values.

The dossier intentionally distinguishes deterministic matching from research-based contextual analysis. It omits empty subsections, keeps insufficient compensation evidence explicit, and labels indirect/community sources without hiding them. Retrieval source-ranking refinement (including source-type anomalies and role relevance) is a future milestone; V1 does not claim perfect research accuracy.
