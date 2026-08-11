# Notificações

## Foundation implemented

`job_notification_events` is a durable outbox boundary. After successful persistence, only job rows created in that collection are evaluated with the existing deterministic evaluator against every persisted candidate profile. The personal MVP has no profile active/enabled field, user ownership, authentication, or RLS.

`new_eligible_job` is created at most once for each `profile_id + job_id + event_type`, enforced by a database unique constraint. It is pending only for an active, deterministic-eligible job with no explicit profile decision. Existing `saved`, `ignored`, `applied`, and `rejected` decisions produce a skipped audit record; rejected deterministic evaluations produce no event. Recollections, observation-only `last_seen_at` refreshes, source updates, and jobs already in the backlog never create discovery events.

Priority is deterministic only: `excellent` for score 80+, `good` for 70-79, and `review` below 70 when eligible. Gemini is never called automatically and cannot create or prioritize an event.

The outbox stores only delivery-safe operational metadata: status, deterministic score/priority, retry timestamps/count, optional future channel, and safe error classification. It does not store credentials, provider payloads, Gemini prompts, or Gemini responses. Candidate generation is isolated from provider persistence: its failure is recorded safely on the collection-run company result and does not roll back jobs or change an otherwise-successful collection to partial.

## Not implemented

## Telegram delivery implemented

## Production diagnostics and integration test

`/insights/notifications` validates an interactive admin server-side before loading service-role diagnostics. It derives exact outbox counts, latest `created_at`, `last_attempt_at`, and `delivered_at`, and a bounded enriched event list from existing persisted data. Provider message IDs, provider payloads, durable latency, and a distributed audit of test messages are unavailable because the current model does not persist them.

`Enviar mensagem de teste` is an authenticated-admin-only server action that invokes the existing Telegram adapter with the configured destination and a fixed message. It creates no outbox event or product data, returns controlled results only, and has a per-process/per-admin 60-second cooldown.

Before the worker calls Telegram it atomically claims an event with the existing `attempt_count` and `last_attempt_at` fields. Pending loads exclude claims younger than 60 seconds, preventing concurrent workers from sending the same active lease. A crashed worker becomes retryable after the lease expires. Telegram acceptance followed by database persistence failure remains at-least-once and can duplicate the later retry.

Only `pending` `new_eligible_job` events are considered. The server-only worker loads at most 20 oldest pending events with fewer than three attempts and processes them sequentially. It composes a concise Portuguese plain-text message from deterministic score/priority plus persisted company and job metadata; descriptions, profile fields, provider bodies, and Gemini content are excluded.

The worker uses `TELEGRAM_BOT_TOKEN` and the fixed `TELEGRAM_CHAT_ID` exclusively from server environment configuration. `POST /api/notifications/deliver` requires its own constant-time checked `NOTIFICATION_WORKER_SECRET`; request bodies cannot choose destination or content. The GitHub collection workflow invokes it only after collection succeeds, so a delivery failure does not alter collection success.

Each send attempt increments `attempt_count` and sets `last_attempt_at`. A successful send marks the same event `delivered`, records `delivered_at`, and sets channel `telegram`. Failures use only controlled classifications (`configuration`, `timeout`, `unauthorized`, `rate_limit`, `bad_request`, `telegram_unavailable`, `persistence_failure`, or `unknown`); attempts one and two remain pending, and attempt three becomes failed. No automatic in-call retry occurs.

The persistence boundary is at-least-once, not exact-once: if Telegram accepts a message but the following database update fails, a retry can duplicate it. Delivered rows are excluded from future loads. Email, WhatsApp, Slack, Discord, Alexa, automatic Gemini enrichment, multi-channel routing, user configuration, Auth, and RLS are not implemented.

The scheduled workflow uses a `deliver-notifications` job with `needs: collect`, so it cannot begin before that workflow's collection job completes successfully. It is still possible for an independently invoked worker to overlap; conditional event updates prevent a stale write from marking a newer attempt as delivered, but the provider/persistence gap remains at-least-once.

There is no in-app, Telegram, email, Alexa, WhatsApp, Slack, Discord, push, or other delivery worker yet. Pending events are not sent. Update notifications, automatic Gemini enrichment, and multi-user/RLS ownership are future milestones.
