# Real sample matching validation — 2026-08

## Scope

Read-only deterministic evaluation of the persisted Greenhouse jobs for `Maria Fernanda - Front-end`. The diagnostic loaded candidate profiles, jobs, target companies, and the selected profile's decisions only through the existing server repositories. It did not invoke Gemini or write to Supabase.

## Sample

- 206 collected jobs: 91 iFood and 115 Wellhub.
- Profile required skills: React and TypeScript.
- Profile accepted work models: remote and hybrid; accepted seniorities: mid and senior.

## Calibration result

Before calibration, 4 jobs were eligible (1.9%) and 202 were rejected. The count did not change after calibration, which intentionally hardened title semantics rather than increasing recall.

The real sample showed that the profile's generic `Software Engineer` target granted a literal title pass to explicit backend roles. It also permitted an Android role with UI/design-system text to obtain a generic engineering title pass. Both still failed required-skill coverage in this sample, but the positive title signal conflicted with the frontend-adjacency policy.

The evaluator now treats generic adjacent engineering titles as frontend-adjacent for frontend-targeting profiles: they need frontend evidence and cannot be explicitly backend, mobile, Android, or iOS. Specific frontend title matches remain unchanged.

| Metric                         | Before | After |
| ------------------------------ | -----: | ----: |
| Eligible                       |      4 |     4 |
| Rejected                       |    202 |   202 |
| Eligibility                    |   1.9% |  1.9% |
| Title hard rejections          |    186 |   202 |
| Required-skill hard rejections |    202 |   202 |
| Work-model hard rejections     |      0 |     0 |

The four eligible jobs are all Wellhub roles. Their deterministic scores are 85, 80, 75, and 70; two have partial required-skill coverage and three have a seniority warning. The sample contained no clearly relevant frontend job that was rejected solely by the changed title rule.

## Insights cross-check

For the all-history period, Insights returned 206 jobs for **Todas coletadas** and 4 jobs for **Compatíveis com o perfil**, matching the diagnostic exactly. The latter is the deterministic `eligible` subset; it does not depend on Gemini or persisted AI analyses.

## Regression coverage

The matching fixture dataset contains 27 parametrized scenarios. It verifies that a frontend-targeting profile which also lists `Software Engineer` rejects backend and Android generic-engineering titles, while accepting a generic software-engineering title with React, TypeScript, and frontend evidence. It also keeps unrelated sales, customer-success, operations, data, legal, finance, HR, and cybersecurity roles rejected.

An incompatible detected work model is a hard rejection and is emitted as a failed reason; seniority and location mismatches remain neutral warnings. This reason-only correction does not change the recorded 4/206 eligibility result or its real-sample work-model count of zero.
