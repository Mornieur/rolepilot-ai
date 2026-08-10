# RolePilot AI

## FeitozaUI visual system

FeitozaUI is the official visual base, consumed only from the public `@feitoza-ui/core@0.3.0` entrypoint. Dashboard, profiles, companies, jobs, evaluation, and insights use its components where appropriate; Tailwind remains for responsive composition. The persisted light/dark shell is shared across these routes. Server-side data access remains on the server, while interactive selection, filters, and actions have narrow client boundaries. No business rule, score, eligibility, collection, Supabase behavior, or Gemini call count changed in the visual rollout. See [the adoption matrix](docs/architecture/FEITOZA_UI_ADOPTION_MATRIX.md).

Successful manual Gemini analyses are stored as profile/job history with provider, model, schema version, timestamp, optional returned usage metadata, and a safe input fingerprint. Reanalysis is explicit; no raw prompt, provider response, error body, key, or cost estimate is stored. The current MVP interface is Portuguese-first.

## Documentação do projeto

- [Visão do produto](docs/product/PRODUCT_VISION.md)
- [Estado atual](docs/CURRENT_STATE.md)
- [Roadmap](docs/product/ROADMAP.md)
- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [Estratégia de IA](docs/architecture/AI_STRATEGY.md)
- [Política de custo](docs/architecture/COST_POLICY.md)
- [Workflow](docs/development/WORKFLOW.md)
- [ADRs](docs/adr/README.md)

RolePilot AI is an early job-intelligence product foundation. Candidate profiles, monitored company configurations, and collected Greenhouse jobs are persisted in Supabase. Compatibility evaluation is performed on demand with explicit, deterministic rules.

## Current status

The personal/local MVP supports persisted candidate profiles plus target companies configured with a public Greenhouse or Lever board identifier. Greenhouse companies can request a read-only manual preview and explicitly save normalized jobs. Stored jobs can then be evaluated against a selected profile without AI or external calls.

## Stack

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS 4, ESLint
- Supabase JavaScript client with server-only access
- Zod validation
- Vitest, React Testing Library, jest-dom, and jsdom

## Local setup

```bash
npm install
cp .env.example .env.local
```

Set these values in `.env.local` from your Supabase project:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
```

The service-role key is server-only. Do not expose it in browser code or commit `.env.local`.

Apply the migrations in order through the Supabase SQL editor:

1. `supabase/migrations/202607290001_create_candidate_profiles.sql`
2. `supabase/migrations/202607290002_create_target_companies.sql`
3. `supabase/migrations/202607290003_create_jobs.sql`
4. `supabase/migrations/202608060001_create_job_user_statuses.sql`
5. `supabase/migrations/202608090001_create_job_ai_analyses.sql`
6. `supabase/migrations/202608100001_collection_runs_and_job_lifecycle.sql`
7. `supabase/migrations/202608100002_create_job_notification_events.sql`
8. `supabase/migrations/202608100003_expand_notification_error_classifications.sql`

Then run `supabase/seed.sql` to insert generic example profiles and companies. It is non-destructive and does not reset data.

Start with `npm run dev`. Use `/profiles` for candidate profiles and `/companies` for company configuration.

## Board identifiers

- Greenhouse: the token in `boards.greenhouse.io/<identifier>`.
- Lever: the site identifier in `jobs.lever.co/<identifier>`.

RolePilot does not call either provider automatically. Greenhouse supports the explicit manual preview described below; Lever remains configuration-only.

## Greenhouse manual preview

RolePilot uses the official public Greenhouse Job Board API endpoint, `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`. This read-only endpoint requires no API key.

To preview a board:

1. Configure an enabled Greenhouse target company with its board identifier.
2. Open `/companies` and choose **Ver vagas**.
3. Request the manual preview and inspect the currently published jobs.

After previewing, choose **Salvar vagas coletadas** to re-fetch Greenhouse on the server and persist fresh normalized records. Jobs are deduplicated by provider, target company, and external job ID; repeated unchanged collections update `last_seen_at`, while changed source fields update the stored record. `first_seen_at` remains stable. Descriptions are normalized to plain text; records collected before this normalization may need recollection. Browse the raw collected pool at `/jobs` and use **Avaliar vagas** to match it against a profile.

No automatic collection, closed-job detection, notifications, Lever ingestion, or authentication is implemented. The transitional manual AI analysis is described below. Collection history is returned to the current UI only; it is not stored as a separate run record.

## Deterministic job evaluation

Open `/jobs/evaluate`, choose a persisted candidate profile, and run the evaluation. This on-demand read-only evaluation reads persisted jobs and profiles but does not fetch a board or write an evaluation to Supabase.

The existing profile fields are sufficient, so no profile migration was needed:

- desired roles must match the job title when configured;
- every required skill must match searchable source text;
- preferred skills add score only;
- excluded skills reject a job and may be an empty list;
- detected seniority, location, and work model reject a job only when explicitly incompatible. Unknown or absent source data is neutral.

Searchable source text is normalized case-insensitively, with accents and punctuation normalized, across title, description, location, departments, and offices. Seniority is detected from the title only. The page shows the rule reasons and a secondary 0–100 score; eligibility is always decided by the mandatory rules, not the score. Results exist only for the request and are not persisted.

## Job actions

Each profile has an independent explicit decision for every persisted job. The available decisions are `saved`, `ignored`, `applied`, and `rejected`; `new` means that no explicit decision row exists. Any manual transition is allowed. The dashboard shows per-profile counters for explicit decisions, and `/jobs/evaluate` exposes the controls.

Notes are stored with a decision but are not yet available in the UI. Job actions never trigger AI, notifications, or an automatic application, and they do not produce learning or insights.

## Descriptive insights

`/insights` provides deterministic descriptive summaries of collected jobs and explicit per-profile decisions. Results are filtered by profile and by `first_seen_at` (last 7 days, last 30 days, or all history). They describe only the collected sample, include its size and small-sample cautions, and do not use AI, change profile weights, or generate career recommendations.

## Manual AI analysis

Manual structured AI analysis uses Gemini Developer API free tier. Live provider validation is pending; ChatGPT Plus does not fund embedded API usage. The analysis is advisory, manual, persisted as per-profile/job history, eligible-only in the current UI, and never submits an application. There is no paid fallback.

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — run the production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run strict TypeScript validation
- `npm test` — run unit and component tests

## Planned pipeline

Job sources → collection → normalization → deduplication → deterministic filters → AI analysis → persistence → dashboard

## Security limitation

There is no user authentication or authorization. This version is intended only as a personal/local MVP and must not be presented as a secure multi-user deployment. A temporary server-side HTTP Basic personal access gate can protect a deployment while the scheduler is validated; it is not a replacement for Supabase Auth, ownership, or RLS. Database writes are validated and remain in server actions; the Supabase service-role key never reaches client components. See [deployment steps](docs/deployment/DEPLOYMENT.md).

## Current limitations

- Candidate profiles and target-company configurations are persisted.
- Greenhouse supports manual preview and explicit job persistence; Lever remains configuration-only.
- Lever is configured but its connector remains planned.
- Deterministic evaluation is available; manual Gemini analysis is persisted after successful validation.
- Scheduled Greenhouse collection is active and production validation confirmed both `workflow_dispatch` and a scheduled run.
- A durable notification outbox creates deterministic candidates for newly persisted eligible jobs; no delivery channel is active.
- There is no authentication, user model, or multi-tenancy.

## Short roadmap

1. Add an approved delivery worker/channel for pending notification events.
2. Add authentication/RLS before treating profile ownership as multi-user.

## Scheduled Greenhouse collection

Enabled Greenhouse companies can be collected from Companies through **Executar coleta agora**. The same server-side orchestration is called by the protected `POST /api/collection/scheduled` endpoint. The GitHub Actions workflow schedules an approximate hourly request (`17 * * * *`) and supports `workflow_dispatch`; scheduled GitHub workflows may run late.

The workflow needs repository secrets named `ROLEPILOT_SCHEDULER_URL` and `SCHEDULER_SECRET`. The application requires server-only `SCHEDULER_SECRET`; do not expose it with `NEXT_PUBLIC_`. Runs retain safe aggregate history, isolate failures, and prevent overlapping running runs. Jobs close only after three successful absences and reopen when seen. No Gemini, notifications, decisions, or applications are automatic.

The collection-lifecycle migration is applied and the GitHub scheduler was validated in production without recording secrets.

## Notification candidate foundation

After successful persistence, only newly created active jobs are evaluated against every persisted candidate profile in this personal MVP. Eligible pairs create at most one `new_eligible_job` outbox event per profile and job. Priority comes only from deterministic score: `excellent` (80+), `good` (70-79), and `review` (below 70). Existing `saved`, `ignored`, `applied`, or `rejected` decisions are recorded as skipped discovery events. Recollections, observation-only refreshes, source updates, and old backlog jobs create no events. Gemini is never called automatically.

The event table is a durable delivery boundary with pending/delivered/failed/skipped states and retry fields, but no Telegram, email, Alexa, or other delivery integration exists yet. Candidate-generation failures do not roll back collected jobs; they are safely classified in the collection-run result.

## Telegram notification delivery

The protected `POST /api/notifications/deliver` route sends a bounded batch of up to 20 pending `new_eligible_job` events sequentially. It uses only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `NOTIFICATION_WORKER_SECRET` on the server. Each failure is classified safely; attempts 1–2 remain pending and attempt 3 becomes failed. The GitHub collection workflow calls delivery only after collection succeeds, so delivery failure cannot change collection history.

Telegram accepts the message before RolePilot can persist `delivered`; if that database write fails, a future retry can duplicate a message. This is an at-least-once boundary, not an exact-once guarantee. Email, WhatsApp, Slack, Discord, Alexa, multi-channel routing, and user-configurable channels are not implemented.

For a local manual check, configure the three Telegram worker variables only in `.env.local`, use a naturally pending local event, and make one authenticated `POST` to the delivery route. Do not create production fixture jobs. A non-production database may instead receive a temporary fixture through the existing local data workflow; remove it through normal local cleanup afterward.
