# RolePilot AI

RolePilot AI is an early foundation for an AI-powered job intelligence platform. It will help candidates review normalized job opportunities against distinct profiles and make focused decisions.

## Current status

The project currently provides a responsive, accessible dashboard with local profile switching and typed mock data. It is intentionally a foundation, not a connected product.

## Planned pipeline

Job sources → collection → normalization → deduplication → deterministic filters → AI analysis → persistence → dashboard

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript with strict checking
- Tailwind CSS 4
- ESLint
- Vitest, React Testing Library, jest-dom, and jsdom

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to a local environment file only when a future feature needs configuration. No environment variables are consumed yet.

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — run the production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run strict TypeScript validation
- `npm test` — run unit and component tests

## Current limitations

- All dashboard data is mocked.
- External job sources are not connected.
- AI analysis is not implemented.
- Automated daily execution is not implemented.
- There is no authentication or persistence layer.

## Short roadmap

1. Persist candidate profiles.
2. Connect an authorized job source.
3. Add deterministic matching and ingestion records.
4. Add structured AI analysis and scheduled daily runs.
