# RolePilot AI

RolePilot AI is an early job-intelligence product foundation. Candidate profiles and monitored company configurations are persisted in Supabase; jobs and compatibility analyses remain local mock data.

## Current status

The personal/local MVP supports persisted candidate profiles plus target companies configured with a public Greenhouse or Lever board identifier. It does not collect jobs yet. The dashboard displays explicitly labelled mocked job analyses.

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
```

The service-role key is server-only. Do not expose it in browser code or commit `.env.local`.

Apply the migrations in order through the Supabase SQL editor:

1. `supabase/migrations/202607290001_create_candidate_profiles.sql`
2. `supabase/migrations/202607290002_create_target_companies.sql`

Then run `supabase/seed.sql` to insert generic example profiles and companies. It is non-destructive and does not reset data.

Start with `npm run dev`. Use `/profiles` for candidate profiles and `/companies` for company configuration.

## Board identifiers

- Greenhouse: the token in `boards.greenhouse.io/<identifier>`.
- Lever: the site identifier in `jobs.lever.co/<identifier>`.

RolePilot stores these identifiers only; it does not call either provider in the current version.

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
- Greenhouse and Lever jobs are not fetched yet.
- Jobs and job analyses are mocked; AI matching is not implemented.
- Automatic collection and daily execution are not implemented.
- Alerts are not implemented. The planned direction is Telegram first, WhatsApp later, and Alexa as an advanced integration.
- There is no authentication, user model, or multi-tenancy.

## Short roadmap

1. Add a read-only Greenhouse connector and manual collection preview.
2. Add deterministic matching and ingestion records.
3. Add structured AI analysis.
4. Add scheduled collection and notification channels.
