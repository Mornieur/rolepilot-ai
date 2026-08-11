# Deterministic matching evaluation — 2026-08

## Scope and dataset status

This is a static matcher audit plus an attempted read-only live-data diagnostic for the Maria frontend profile. The diagnostic was intentionally server-side only, used no Gemini code path, and contained no write operation. The most recent attempt was at `2026-08-11T17:38:56-03:00`.

The existing server-only Supabase configuration was present. The batched read-only requests for candidate profiles, jobs, and companies reached Supabase but were rejected with `PGRST303: JWT issued at future`. This is a backend JWT-time validation failure, so this runtime cannot safely read the current sample until its clock/JWT validity is corrected. The temporary Vitest harness was removed immediately. No public route, script, fixture, migration, or database change remains.

Consequently, the current production-like dataset was **not** read in this evaluation. Do not treat the historical 206-job snapshot in `MATCHING_REAL_SAMPLE_2026-08.md` as a current 260+ job measurement. The historical report records four eligible jobs, but it is not a substitute for a fresh sample.

The unavailable fields below must be measured only by rerunning the removed server-side, read-only harness in an environment that has the existing service-role configuration: active jobs, eligible/rejected counts and rate, company splits, score/reason/warning distributions, work-model and seniority distributions, decision comparison, top 20 eligible jobs, and top 30 rejected jobs.

## Profile and matcher semantics

The matcher evaluates searchable normalized text from title, description, location, departments, and offices. It lowercases text, removes accents and punctuation (while retaining `#` and `+`), and matches whole normalized terms; it has no aliases, embeddings, inference, or Gemini dependency.

| Signal                | Current behavior                                                                                                                                                                                                                              |        Score effect | Hard reject?                          | Warning?                                 | Known limitation                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------: | ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Desired title         | A configured desired role must match the title. For frontend-targeting profiles, `Software Engineer`, Full Stack, Web Engineer, and UI Engineer are adjacent only with frontend/UI/web/React evidence and not with explicitly distant titles. |         +25 on pass | Yes                                   | No                                       | Literal phrase matching; uncommon title variants need explicit evidence or configuration.   |
| Frontend adjacency    | Direct frontend title evidence passes. Generic engineering adjacency requires searchable frontend evidence.                                                                                                                                   |   Included in title | Yes, when no title pass               | No                                       | The evidence set is deliberately small: frontend, front end, React, UI, web.                |
| Clearly distant title | Backend, data engineer, cyber/security, Android/iOS/mobile, product manager, sales, HR/recruiting titles prevent an adjacent-title pass.                                                                                                      |                   0 | Yes, if title has no other valid pass | No                                       | The list is finite and title-based; it is not a semantic taxonomy.                          |
| Required skills       | At least 50% of unique configured required skills must be found in searchable text.                                                                                                                                                           |         +35 on pass | Yes                                   | Partial coverage is neutral when 50%–99% | Literal terms only; aliases and experience implied without the exact term are not detected. |
| Preferred skills      | Each found preferred term adds five points, capped at 15.                                                                                                                                                                                     |            0 to +15 | No                                    | No                                       | Presence is not weighted by context or recency.                                             |
| Excluded skills       | Any exact excluded term found in searchable text fails the rule.                                                                                                                                                                              |                 -40 | Yes                                   | No                                       | Whole-term matching avoids `Java` matching `JavaScript`, but cannot interpret context.      |
| Seniority             | Detected from title only: junior/intern, mid/pleno, senior, staff/principal/lead/manager/head/director. A mismatch remains eligible.                                                                                                          |           +10 / -10 | No                                    | Mismatch is neutral                      | Title-only detection can miss description-only or unusual seniority labels.                 |
| Location              | Matches configured locations only against location and offices. A mismatch remains eligible; unknown is neutral.                                                                                                                              |           +10 / -10 | No                                    | Mismatch or unknown is neutral           | It does not infer geography from the description.                                           |
| Work model            | Detects explicit remote, hybrid, or on-site signals in searchable text, location, and offices. An explicit incompatible model fails. Unknown is neutral.                                                                                      |           +10 / -10 | Yes                                   | Unknown is neutral                       | Fixed expressions intentionally avoid treating “remote team” as a remote job.               |
| Final eligibility     | `title && required && !excluded && compatible-work-model`; seniority, location, and total score never decide eligibility.                                                                                                                     | Score clamped 0–100 | See above                             | See above                                | A high score cannot override a mandatory rule.                                              |
| Sorting               | Eligible first, then score descending, last-seen descending, title ascending, and id ascending.                                                                                                                                               |                 N/A | N/A                                   | N/A                                      | Freshness is only a tie-breaker.                                                            |

## Historical evidence and current risk review

The base branch already contains the prior title-adjacency calibration (`34bdc74`). Its historical sample showed generic `Software Engineer` configuration giving a literal positive title signal to explicit backend and Android jobs. The present implementation blocks that generic-adjacent path unless frontend evidence exists and the title is not distant. This behavior is covered by the matching fixture dataset.

The historical snapshot also reported four Wellhub eligible jobs, scores of 85, 80, 75, and 70, two partial-required-skill warnings, and three seniority warnings. It reported no work-model hard rejections. Those facts are retained as context only; no current job-level classifications can be asserted without the fresh read-only dataset.

Static false-positive safeguards are present for backend, mobile/Android/iOS, data, security, product, sales, HR/recruiting, legal, finance, and operations-style fixture cases. Static false-negative coverage includes Software Engineer with frontend evidence, Full Stack with frontend evidence, UI Engineer, and partial skill coverage. The current fixture set does not yet cover explicit Frontend Platform or Developer Experience examples; adding them would require a real failure case or an approved policy decision, not speculation.

## User-decision signals and quality metrics

`saved`, `ignored`, `applied`, and `rejected` are explicit per-profile labels; `new` is the absence of a persisted decision. They remain evaluation labels only—there is no automatic learning or profile adjustment.

No decision sample could be read locally, so the following descriptive metrics are not reported with invented values:

- eligible rate;
- manually interesting rate (`saved` or `applied` among reviewed eligible jobs);
- false-positive candidates (ignored/rejected eligible jobs);
- false-negative candidates (saved/applied rejected jobs);
- title, required-skill, and work-model hard-rejection shares;
- seniority, location, and partial-required-skill warning shares;
- average score by explicit decision.

If a future read-only sample has enough decisions, it may additionally show `interesting / eligible-reviewed` and `interesting-rejected / all-interesting-reviewed` as small-sample diagnostics, never as statistically reliable ML metrics.

## Insights review

Insights already exposes the deterministic compatible subset, collected sample size, explicit decision counts, work-model and seniority distributions, and ranked companies. It does not calculate rejection reasons or matcher-warning distributions. No Insights UI change was made because there is no fresh evidence identifying a missing decision-making metric, and a broader dashboard would not improve the blocked diagnostic.

## Calibration proposals and changes

No new calibration is proposed or implemented. The only strongly evidenced calibration available in the repository—the frontend-adjacent generic engineering guard—was already merged into the base branch before this task began. Changing thresholds, aliases, seniority, location, work model, or score weights without the current sample would be speculative and would violate the diagnostic-first boundary.

When a fresh read-only sample is available, each proposed calibration must name the affected jobs, current reason(s), expected precision/recall effect, risk, and regression tests. Company-specific exceptions are not acceptable.

## Explicit non-changes

- No Gemini calls, prompt processing, embeddings, vector search, probabilistic scoring, learning, or automatic decisions.
- No Supabase write, migration, production mutation, public diagnostic endpoint, or retained diagnostic harness.
- No matcher, fixture, Insights, or factual-product-document behavior change.

## Admin matching diagnostics surface

The application now has an admin-only, server-authorized diagnostic route at
`/insights/matching`. It uses the candidate profile chosen from the admin's
authorized profile list, performs at most three bounded batch reads (persisted jobs,
target companies, and that profile's decisions), and evaluates the current
sample in memory with the existing `evaluateJob` function. It makes no Gemini
call and performs no write.

The surface renders descriptive current-sample totals, active lifecycle split,
eligibility and company splits, score buckets, hard-rejection and warning
distributions, detected work model and seniority, bounded compatible and
rejected lists, suspicious text-pattern candidates, and decision comparisons.
A rejected job can appear under more than one hard-rejection reason; this is
stated in the UI and is intentional rather than a mutually-exclusive count.

The loader has a 12-second bounded failure path and returns a controlled
Portuguese error without provider details. Production numbers are still not
recorded in this document: they require an authenticated admin smoke test in
the deployed runtime. The route is an operational measurement surface, not a
calibration or learning mechanism; no matcher calibration is justified until
that current sample is reviewed.
