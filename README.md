# RolePilot AI

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
2. Open `/companies` and choose **Preview jobs**.
3. Request the manual preview and inspect the currently published jobs.

After previewing, choose **Save collected jobs** to re-fetch Greenhouse on the server and persist fresh normalized records. Jobs are deduplicated by provider, target company, and external job ID; repeated unchanged collections update `last_seen_at`, while changed source fields update the stored record. `first_seen_at` remains stable. Browse stored source jobs at `/jobs`.

No automatic collection, closed-job detection, notifications, Lever ingestion, or authentication is implemented. The transitional manual AI analysis is described below. Collection history is returned to the current UI only; it is not stored as a separate run record.

## Deterministic job evaluation

Open `/jobs/evaluate`, choose a persisted candidate profile, and run the evaluation. This on-demand read-only evaluation reads persisted jobs and profiles but does not fetch a board or write an evaluation to Supabase.

The existing profile fields are sufficient, so no profile migration was needed:

- desired roles must match the job title when configured;
- every required skill must match searchable source text;
- preferred skills add score only;
- excluded skills reject a job;
- detected seniority, location, and work model reject a job only when explicitly incompatible. Unknown or absent source data is neutral.

Searchable source text is normalized case-insensitively, with accents and punctuation normalized, across title, description, location, departments, and offices. Seniority is detected from the title only. The page shows the rule reasons and a secondary 0–100 score; eligibility is always decided by the mandatory rules, not the score. Results exist only for the request and are not persisted.

## Manual AI analysis

Manual structured AI analysis uses Gemini Developer API free tier. Live provider validation is pending; ChatGPT Plus does not fund embedded API usage. The analysis is advisory, manual, non-persistent, eligible-only in the current UI, and never submits an application. There is no paid fallback.

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

There is no authentication or authorization. This version is intended only as a personal/local MVP and must not be presented as a secure multi-user deployment. Database writes are validated and remain in server actions; the Supabase service-role key never reaches client components.

## Current limitations

- Candidate profiles and target-company configurations are persisted.
- Greenhouse supports manual preview and explicit job persistence; Lever remains configuration-only.
- Lever is configured but its connector remains planned.
- Deterministic evaluation is available; a transitional manual OpenAI analysis exists but Gemini is the approved future runtime.
- Automatic collection and daily execution are not implemented.
- Alerts are not implemented. The planned direction is Telegram first, WhatsApp later, and Alexa as an advanced integration.
- There is no authentication, user model, or multi-tenancy.

## Short roadmap

1. Migrate the transitional OpenAI runtime to Gemini free tier and validate one live analysis.
2. Add scheduled collection and notification channels.
