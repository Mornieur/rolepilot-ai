# Opportunity Intelligence V1

The canonical opportunity detail page is a decision and preparation workspace. Deterministic matching remains authoritative for eligibility, score and priority. Tavily retrieves bounded external evidence; Gemini performs one advisory synthesis and cannot change matching, decisions or notifications.

## Retrieval and cost bounds

An explicit user action performs at most six Tavily Search calls, selects at most ten sources and extracts at most four sources only when the search snippet is insufficient. There is no Tavily Research call, recursive follow-up, page-load research, collection research or Telegram research. One newly researched dossier uses at most one Gemini call. A fresh cached dossier is reused.

## Evidence and uncertainty

Sources are Tier 1 official/filing/careers material, Tier 2 established press, compensation or career platforms, or Tier 3 community reports. Tier 3 is always anecdotal. Claims use `known`, `likely`, `anecdotal` or `unknown`; incompatible salary units, geographies and compensation components are retained as conflicts rather than averaged. URLs in the dossier come only from normalized Tavily records.

## Freshness, privacy and safety

Job/profile/schema/strategy changes invalidate the fingerprint. Fundamentals have a 90-day policy, compensation and hiring process 45 days, and current-company moment 14 days. V1 uses a conservative 14-day overall dossier expiry. Gemini receives only bounded job/profile matching context and sanitized source excerpts; it receives no credentials, auth data, raw HTML or raw provider body. Web pages are untrusted data, never instructions.

`opportunity_research_dossiers` stores validated structured results; `opportunity_research_sources` stores citations and bounded excerpts, never prompts, raw HTML, provider responses, keys or error bodies. Source access inherits dossier/profile ownership. `TAVILY_API_KEY` is server-only.
