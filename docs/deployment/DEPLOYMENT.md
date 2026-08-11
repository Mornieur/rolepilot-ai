# Public deployment for scheduled collection

Supabase Auth is the interactive-user authentication boundary. Unauthenticated interactive
requests redirect to `/login`; ownership, persisted roles, and RLS authorize access after login.
The scheduler and notification worker have separate bearer secrets; neither grants interactive
user access, and an interactive user session does not grant system-route access.

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
3. Deploy manually through Vercel and obtain the production HTTPS URL.

## Verify the deployment boundary

1. Open `/`, `/profiles`, `/companies`, `/jobs`, `/jobs/evaluate`, and `/insights` in a
   private browser window. Each must redirect to `/login` without a Supabase session.
2. Sign in with a mapped account and confirm its allowed routes load; verify a normal user
   cannot access another profile and an admin can access the authorized admin scope.
3. Send a `POST` to `/api/collection/scheduled` without an `Authorization: Bearer ...`
   header. It must return `401`.
4. Send a `POST` to `/api/notifications/deliver` without its bearer header. It must return `401`.
5. Do not send either correct system secret for these initial public-access checks.

## Connect GitHub Actions only after the boundary passes

1. In GitHub repository secrets, configure `ROLEPILOT_SCHEDULER_URL`, `SCHEDULER_SECRET`,
   `NOTIFICATION_WORKER_URL`, and `NOTIFICATION_WORKER_SECRET`. Both URLs are the
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

The service-role key must remain server-only in every environment. Public signup, OAuth, and
broader multi-tenant product rollout remain out of scope.

## Auth deployment boundary

Supabase Auth, ownership, and RLS have passed the production smoke test. Do not add a second
interactive access secret. Keep scheduler and notification bearer secrets unchanged. The
ownership model and the explicit future `user_id not null` decision are documented in
`docs/architecture/AUTHENTICATION_STRATEGY.md`.
