# Opportunity Inbox V1

`/inbox` answers which current opportunities deserve attention for one selected, authorized profile. A normal user sees only profiles returned by the ownership-aware profile loader; an administrator may select the profiles allowed by the existing policy. An arbitrary `profileId` never reaches the Inbox loader.

The queue reads three bounded batches: all persisted jobs, target companies, and `job_user_statuses` for the selected profile. It evaluates and joins them in memory. It does not write on opening, create notification events, call Gemini, or change matcher semantics.

Only active (`is_active !== false`) deterministic-eligible jobs are included. The default state filter is actionable jobs: `new` (no persisted decision) and `saved`. `applied`, `ignored`, and `rejected` are available through status filters. Existing decision storage remains the only decision source.

Priority bands are deterministic: Excellent is score 80 or above, Good is 70–79, and Review is any lower eligible score. The exact sort is priority band, `first_seen_at` descending, title ascending, then job id ascending. “Nova” is derived, not persisted: a `new` decision whose `first_seen_at` is within 24 hours of rendering.

Cards show compact persisted metadata, deterministic evidence and warnings, recency, links to the existing evaluation view and source, plus actions that reuse the authorized job-decision server action. The explanation uses only matcher evidence: matched required/preferred skills and positive seniority/work-model matches.

Telegram delivery remains unchanged except for its RolePilot deep link: eligible-job messages point to the selected profile's opportunity detail (`/opportunities/[jobId]?profileId=…`). Source links remain intact.
