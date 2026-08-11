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
   `ROLEPILOT_NOTIFICATION_WORKER_URL`, and `NOTIFICATION_WORKER_SECRET`. Both URLs are the
   production HTTPS base URL, without their API suffixes.
2. Confirm the workflow uses `POST`, the dedicated bearer secrets, and the approximately-hourly
   `17 * * * *` schedule. Delivery is a second job that waits for successful collection; its
   failure is independently visible and does not change collection history.
3. Manually run the existing `workflow_dispatch` only after the above access checks pass.
4. Verify the resulting `collection_runs` row has `trigger = scheduled`, then review the
   GitHub Actions run before relying on later cron invocations.

## Limits and follow-up

`maxDuration = 60` is explicitly configured on the scheduler route. This accommodates the
observed 21–24 second collection while remaining within Vercel Hobby's 60-second configurable
limit when Fluid compute is unavailable. Reassess the duration if enabled companies or provider
latency materially increase.

The service-role key must remain server-only in every environment. Public signup, OAuth, and
broader multi-tenant product rollout remain out of scope.

## Auth deployment boundary

Supabase Auth, ownership, and RLS have passed the production smoke test. Do not add a second
interactive access secret. Keep scheduler and notification bearer secrets unchanged. The
ownership model and the explicit future `user_id not null` decision are documented in
`docs/architecture/AUTHENTICATION_STRATEGY.md`.
