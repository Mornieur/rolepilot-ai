# Metrics and insights

The first implementation is deterministic and descriptive. It reads persisted jobs, companies, one selected profile, and that profile's explicit job decisions. `new` remains the absence of a decision row. Results use `first_seen_at` for 7-day, 30-day, and all-history samples.

Insights can show either all collected jobs or only the selected profile's deterministically eligible jobs. The relevant view uses no Gemini call and creates no persistence.

The Insights scope is carried by the GET query parameter `scope`: `all` is the complete collected pool and `relevant` is the deterministic eligible subset. The rendered sample explanation names the selected subset and its live sample size.

Rates use explicit decisions as their denominator: `saved / explicit decisions` and `applied / explicit decisions`; a zero denominator yields `0%`. Rankings sort by count descending then label ascending. The UI shows sample size and cautions below 10 jobs (very small) and 10–29 jobs (limited). These are collected-sample observations, not claims about the Brazilian market. No AI, learning, profile-weight update, or career recommendation occurs.

# Matching diagnostics

The admin-only `/insights/matching` route is a descriptive operational view of
one authorized candidate profile. It loads jobs, companies, and profile
decisions once per request, evaluates in memory, and bounds card rendering to
20 eligible and 30 rejected jobs. It uses no Gemini history lookup or write.
Its descriptive rates are not ML accuracy metrics; multiple hard-rule reasons
may be counted for one rejected job. A 12-second loader bound produces a
controlled Portuguese error when server data cannot be loaded.
