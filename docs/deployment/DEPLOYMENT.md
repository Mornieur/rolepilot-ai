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

`maxDuration = 60` is explicitly configured on the scheduler route. This accommodates the
observed 21–24 second collection while remaining within Vercel Hobby's 60-second configurable
limit when Fluid compute is unavailable. Reassess the duration if enabled companies or provider
latency materially increase.

Replace this temporary gate before any multi-user/public product release with Supabase Auth,
per-user ownership, RLS, and authorization checks in the data-access layer. The service-role
key must remain server-only in every environment.
