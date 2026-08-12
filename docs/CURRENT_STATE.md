# Current State

## Repository

- Sempre confirme a branch e o working tree com Git antes de continuar.

## Runtime provider

- Approved and current: Gemini Developer API (`@google/genai`, `GEMINI_API_KEY`, `GEMINI_MODEL`).
- OpenAI is removed.

## Implemented

Candidate profiles, target companies, Greenhouse preview, manual collection with deduplication, persisted jobs, deterministic filtering, manual structured Gemini analysis with persisted history, job actions, deterministic insights, and the FeitozaUI visual rollout are implemented. Insights resolves the authenticated user's authorized profile collection before accepting a `profileId` from the URL. Normal users can load only their own profile-derived Insights; admins may select all profiles. Unauthorized, missing, and invalid profile IDs use one controlled unavailable state and do not invoke the service-role Insights loader.

A interface do MVP é em português. A navegação principal expõe Início, Perfis, Empresas, Vagas, Caixa, Avaliar vagas e Insights. `excludedSkills` pode ficar vazio e é persistido como uma lista vazia.

Não há ocorrência de `fdprocessedid` no código-fonte. Um aviso de hidratação contendo esse atributo deve ser investigado sem extensões do navegador antes de atribuí-lo ao RolePilot; não há `suppressHydrationWarning` como paliativo.

Job actions are independent per profile and job pair. `new` means no explicit decision; persisted decisions are `saved`, `ignored`, `applied`, and `rejected`. Manual transitions are allowed. The dashboard has isolated per-profile counters. Notes exist in the database but not in the UI.

Job decision controls submit explicit status values and immediately display the returned persisted state and concise feedback. The persisted choice also remains visibly selected after the request and on a server-loaded refresh. During a decision request, only the submitted control shows a Portuguese pending label. Insights preserves its selected collected/relevant scope through GET search parameters; the relevant scope is deterministic-only.

The evaluation route prioritizes compact compatible opportunities, with score, warnings, decision state, and Gemini state visible before expandable deterministic details. Rejected jobs are a secondary, on-demand diagnostic list. Evaluation loads per-profile decisions in one query and latest Gemini analyses for compatible jobs in one query; it does not cache mutable decisions or analyses. Saving a decision no longer revalidates and re-renders the full evaluation route because the action response already carries the persisted decision state.

`/inbox` is the daily, profile-scoped opportunity queue. It loads active persisted jobs, companies, and selected-profile decisions in three batch reads, evaluates and ranks in memory, and never writes on read or invokes Gemini. Only deterministic-eligible active jobs appear. The default view focuses on `new` and `saved`; `applied`, `ignored`, and `rejected` remain filterable. Priority is `excellent` (80+), `good` (70–79), then `review`; ordering is priority, newest `first_seen_at`, title, and id. A new opportunity is a decisionless job first seen within 24 hours. Telegram links now target `/inbox?profileId=…`.

## Not implemented

Automatic learning, Lever collection, and analytics are not implemented. Supabase Auth, ownership, RLS, and server authorization are implemented and production smoke-tested. Interactive routes use Supabase Auth; unauthenticated requests redirect to `/login`, and the temporary server-side HTTP Basic gate has been removed. Job actions do not trigger AI, notifications, or automatic applications.

## Scheduled collection foundation

Manual and scheduled collection share one server-side orchestration. GitHub Actions requests the protected scheduler route approximately hourly; it may be delayed. Production validation confirmed `workflow_dispatch` and a successful scheduled run persisted with `trigger=scheduled`, including new jobs. Collection runs are persisted, support partial failure, and enabled Lever configurations are safely skipped. Jobs close after three successful absences and reopen when seen again. Gemini and decisions are never automatic. Companies provides “Executar coleta agora” and a compact last-run status.

The scheduler workflow supports `workflow_dispatch` and uses only the repository-secret names `ROLEPILOT_SCHEDULER_URL` and `SCHEDULER_SECRET`. The collection route has a bounded 180-second server duration; the GitHub client has a separate 10-second connection timeout and 210-second total timeout. A database function atomically recovers only `running` rows older than five minutes as `failed` with `finished_at` populated, then attempts a new acquisition. Recent rows remain controlled overlaps, and the partial unique index still permits at most one running row. Migration `202608100001_collection_runs_and_job_lifecycle.sql` is applied and migration history is synchronized; `202608110002_acquire_collection_run_with_stale_recovery.sql` must be applied through the normal migration process. Manual and scheduled GitHub Actions collection against the real Supabase database are validated.

## Migrations

`202607290001_create_candidate_profiles.sql`, `202607290002_create_target_companies.sql`, `202607290003_create_jobs.sql`, `202608060001_create_job_user_statuses.sql`, `202608090001_create_job_ai_analyses.sql`, `202608100001_collection_runs_and_job_lifecycle.sql`, `202608100002_create_job_notification_events.sql`, and `202608100003_expand_notification_error_classifications.sql`.

## Notification foundation

Telegram is the first delivery channel: a dedicated protected worker handles bounded batches of pending events and records safe retry metadata. It does not call Gemini. Delivery is at-least-once because a successful provider response followed by a database persistence failure can be retried. Email, WhatsApp, Alexa, multi-channel routing, user configuration, authentication, and RLS remain future work.

The database-backed `job_notification_events` outbox creates profile-isolated `new_eligible_job` events only after new jobs persist successfully. Eligibility and priority are deterministic; score 80+ is `excellent`, 70-79 is `good`, and lower eligible scores are `review`. The unique profile/job/event constraint makes repeated collections idempotent. Explicit decisions `saved`, `ignored`, `applied`, and `rejected` create a skipped record rather than a candidate. No backlog, unchanged observation, update, Gemini result, provider payload, secret, or delivery channel is involved.

All persisted profiles are evaluated because this personal MVP has no active/enabled profile field, authentication, ownership, or RLS. Candidate-generation failures are recorded safely in the collection-run company result and do not undo successfully persisted jobs. Delivery workers and Telegram/email/Alexa remain future work.

## External integrations

Greenhouse é manual e somente leitura até o salvamento explícito. A prévia normaliza descrições como texto simples; registros antigos que preservaram marcação precisam ser coletados novamente para ficar limpos. A coleta importa o painel publicado inteiro e a compatibilidade é calculada depois para cada perfil. Supabase stores product data. Gemini analysis is manual and advisory.

## Current milestone

Compact evaluation workflow and decision feedback after real-data manual smoke-test validation.

## Next approved milestone

No next milestone is approved in this document.

## Collection classification

## Notifications V1 — production validation and observability

`/insights/notifications` is admin-only and server-authorized before its data loads. It shows only safe Telegram configuration presence, exact pending/delivered/failed counts, latest event/attempt/success timestamps, and bounded recent outbox events. It never exposes Telegram credentials or chat identifiers.

The fixed Telegram integration test uses the existing server-only adapter and creates no job, matching result, decision, collection run, or outbox event. It has a per-admin one-minute cooldown. Normal `new_eligible_job` delivery remains separate.

The worker atomically leases a pending row before Telegram delivery using the existing persisted attempt count and last-attempt timestamp. Concurrent workers cannot send the same active lease; a 60-second expired lease is retried. The provider-acceptance/persistence-failure gap remains intentionally at-least-once.

Os resultados e o histórico de coleta contam “atualizadas” apenas quando o conteúdo
material normalizado da fonte muda. A renovação de `last_seen_at` e a manutenção ou
reativação de ciclo de vida são persistidas, mas contam como “sem alteração” quando o
conteúdo da vaga é o mesmo.

# Admin matching diagnostics

## Opportunity Intelligence V1

`/opportunities/[jobId]?profileId=…` resolves an authorized profile before derived loading and shows deterministic job evidence with no AI or retrieval. The explicit research action is the only Tavily/Gemini entry point. Local-only migration `202608110003_opportunity_research_dossiers.sql` adds profile-owned dossier/source persistence and has not been applied remotely.

`/insights/matching` is an admin-only, server-authorized, read-only diagnostic
surface. It evaluates the current persisted sample with the existing
deterministic matcher and profile-specific decisions, with bounded batch reads
and a controlled failure state. It does not invoke Gemini, learn, write, or
calibrate matching. A deployed authenticated admin smoke test remains needed
to record fresh production measurements.
