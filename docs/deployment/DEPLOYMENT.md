# Public deployment for scheduled collection

This is a temporary, personal-MVP deployment boundary. It is not user authentication,
authorization, Supabase Auth, RLS, or a secure multi-user SaaS architecture.

The deployed UI is protected with HTTP Basic authentication by `PERSONAL_ACCESS_SECRET`.
The scheduler has a separate `SCHEDULER_SECRET`; scheduler access never grants UI access,
and UI access never grants scheduler access.

## Before deployment

1. Connect this repository to a personal Vercel Hobby project. Do not enable paid services,
   Vercel Cron, or a production deployment-protection bypass.
2. Configure these variable names for the Vercel Production environment. Set values only in
   the Vercel dashboard; never commit or share them:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `SCHEDULER_SECRET`
   - `NOTIFICATION_WORKER_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `PERSONAL_ACCESS_SECRET`
3. Deploy manually through Vercel and obtain the production HTTPS URL.

## Verify the deployment boundary

1. Open `/`, `/profiles`, `/companies`, `/jobs`, `/jobs/evaluate`, and `/insights` in a
   private browser window. Each must require the personal HTTP Basic credential before any
   data is rendered.
2. Confirm static assets still load after authentication.
3. Send a `POST` to `/api/collection/scheduled` without an `Authorization: Bearer ...`
   header. It must return `401`.
4. Do not send the correct scheduler secret for this initial public-access check.

## Connect GitHub Actions only after the boundary passes

1. In GitHub repository secrets, configure `ROLEPILOT_SCHEDULER_URL`, `SCHEDULER_SECRET`,
   `ROLEPILOT_NOTIFICATION_WORKER_URL`, and `NOTIFICATION_WORKER_SECRET`. Both URLs are the
   production HTTPS base URL, without their API suffixes.
2. Confirm the workflow uses `POST`, the dedicated bearer secrets, and the approximately-hourly
   `17 * * * *` schedule. Delivery is a second job that waits for successful collection; its
   failure is independently visible and does not change collection history.
3. Manually run the existing `workflow_dispatch` only after the above access checks pass.
4. Verify the resulting `collection_runs` row has `trigger = scheduled`, then review the
   GitHub Actions run before relying on later cron invocations.

## Limits and follow-up

`maxDuration = 180` is explicitly configured on the scheduler route. Vercel's current Fluid
Compute documentation permits up to 300 seconds on Hobby, so this remains bounded while leaving
meaningful headroom above observed 50-55 second collections. The workflow's `curl` has a separate
10-second connection timeout and 210-second total timeout; the collection job itself has a
5-minute ceiling. Confirm Fluid Compute remains enabled for the production project before relying
on the 180-second setting.

The scheduler recovers a `collection_runs` row only after it has remained `running` for more than
5 minutes, which is greater than the maximum legitimate 180-second execution. Recovery atomically
marks that historical row `failed` and sets `finished_at`, without changing its counters or company
results, then acquires a replacement row subject to the existing unique-running index. A recent
overlap returns 409 and is a controlled workflow skip; authorization failures, other client errors,
server errors, and transport failures remain workflow failures. This requires migration
`202608110002_acquire_collection_run_with_stale_recovery.sql`; do not apply it remotely without
the normal authorized migration procedure.

The previously abandoned production run `00084f32-81b0-4e9f-8e20-7855d04c87df` may be manually
finalized only after confirming it is still stale. Do not run an automated production repair from
this repository.

Replace this temporary gate before any multi-user/public product release with Supabase Auth,
per-user ownership, RLS, and authorization checks in the data-access layer. The service-role
key must remain server-only in every environment.

## Auth rollout transition

Supabase Auth and RLS are implemented, but do not remove `PERSONAL_ACCESS_SECRET` in this deployment. Apply the new migration, create and explicitly map Maria and Flávia accounts, then deploy the auth-enabled application and validate login/isolation. Keep scheduler and notification bearer secrets unchanged. The full order and safe backfill procedure are in `docs/architecture/AUTHENTICATION_STRATEGY.md`.
