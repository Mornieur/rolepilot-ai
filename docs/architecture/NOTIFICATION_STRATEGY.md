# Notificações

## Foundation implemented

`job_notification_events` is a durable outbox boundary. After successful persistence, only job rows created in that collection are evaluated with the existing deterministic evaluator against every persisted candidate profile. The personal MVP has no profile active/enabled field, user ownership, authentication, or RLS.

`new_eligible_job` is created at most once for each `profile_id + job_id + event_type`, enforced by a database unique constraint. It is pending only for an active, deterministic-eligible job with no explicit profile decision. Existing `saved`, `ignored`, `applied`, and `rejected` decisions produce a skipped audit record; rejected deterministic evaluations produce no event. Recollections, observation-only `last_seen_at` refreshes, source updates, and jobs already in the backlog never create discovery events.

Priority is deterministic only: `excellent` for score 80+, `good` for 70-79, and `review` below 70 when eligible. Gemini is never called automatically and cannot create or prioritize an event.

The outbox stores only delivery-safe operational metadata: status, deterministic score/priority, retry timestamps/count, optional future channel, and safe error classification. It does not store credentials, provider payloads, Gemini prompts, or Gemini responses. Candidate generation is isolated from provider persistence: its failure is recorded safely on the collection-run company result and does not roll back jobs or change an otherwise-successful collection to partial.

## Not implemented

There is no in-app, Telegram, email, Alexa, WhatsApp, Slack, Discord, push, or other delivery worker yet. Pending events are not sent. Update notifications, automatic Gemini enrichment, and multi-user/RLS ownership are future milestones.
