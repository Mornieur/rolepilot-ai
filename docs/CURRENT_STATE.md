# Current State

## Repository

- Branch: `develop`.
- Job Actions is ready for commit validation. Pre-existing unrelated changes in `.gitignore` and `supabase/.temp/` are preserved.

## Runtime provider

- Approved and current: Gemini Developer API (`@google/genai`, `GEMINI_API_KEY`, `GEMINI_MODEL`).
- OpenAI is removed.

## Implemented

Candidate profiles, target companies, Greenhouse preview, manual collection with deduplication, persisted jobs, deterministic filtering, and manual structured Gemini analysis are implemented.

Job actions are implemented per profile + job pair. `new` means that no explicit decision row exists; persisted decisions are `saved`, `ignored`, `applied`, and `rejected`. Manual transitions are allowed. The dashboard has isolated per-profile counters. Notes exist in the database but not in the UI.

## Not implemented

Automatic learning, descriptive insights, scheduling, Lever collection, persisted analysis, notifications, FeitozaUI, authentication/RLS, and analytics are not implemented. Job actions do not trigger AI, notifications, or automatic applications.

## Migrations

`202607290001_create_candidate_profiles.sql`, `202607290002_create_target_companies.sql`, `202607290003_create_jobs.sql`, and `202608060001_create_job_user_statuses.sql`.

## External integrations

Greenhouse is manual and read-only until an explicit collection is requested. Supabase stores product data. Gemini analysis is manual and advisory.

## Current milestone

Deterministic descriptive job insights, filtered by profile and period.

## Next approved milestone

Review deterministic insights with real collected data before considering another reporting slice.
