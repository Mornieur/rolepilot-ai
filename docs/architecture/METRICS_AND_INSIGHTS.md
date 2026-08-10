# Metrics and insights

The first implementation is deterministic and descriptive. It reads persisted jobs, companies, one selected profile, and that profile's explicit job decisions. `new` remains the absence of a decision row. Results use `first_seen_at` for 7-day, 30-day, and all-history samples.

Insights can show either all collected jobs or only the selected profile's deterministically eligible jobs. The relevant view uses no Gemini call and creates no persistence.

Rates use explicit decisions as their denominator: `saved / explicit decisions` and `applied / explicit decisions`; a zero denominator yields `0%`. Rankings sort by count descending then label ascending. The UI shows sample size and cautions below 10 jobs (very small) and 10–29 jobs (limited). These are collected-sample observations, not claims about the Brazilian market. No AI, learning, profile-weight update, or career recommendation occurs.
