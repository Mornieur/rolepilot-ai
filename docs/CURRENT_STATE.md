# Current State

## Repository

- Sempre confirme a branch e o working tree com Git antes de continuar.

## Runtime provider

- Approved and current: Gemini Developer API (`@google/genai`, `GEMINI_API_KEY`, `GEMINI_MODEL`).
- OpenAI is removed.

## Implemented

Candidate profiles, target companies, Greenhouse preview, manual collection with deduplication, persisted jobs, deterministic filtering, manual structured Gemini analysis with persisted history, job actions, deterministic insights, and the FeitozaUI visual rollout are implemented.

A interface do MVP é em português. A navegação principal expõe Início, Perfis, Empresas, Vagas, Avaliar vagas e Insights. `excludedSkills` pode ficar vazio e é persistido como uma lista vazia.

Não há ocorrência de `fdprocessedid` no código-fonte. Um aviso de hidratação contendo esse atributo deve ser investigado sem extensões do navegador antes de atribuí-lo ao RolePilot; não há `suppressHydrationWarning` como paliativo.

Job actions are independent per profile and job pair. `new` means no explicit decision; persisted decisions are `saved`, `ignored`, `applied`, and `rejected`. Manual transitions are allowed. The dashboard has isolated per-profile counters. Notes exist in the database but not in the UI.

Job decision controls submit explicit status values and immediately display the returned persisted state and concise feedback. The persisted choice also remains visibly selected after the request and on a server-loaded refresh. During a decision request, only the submitted control shows a Portuguese pending label. Insights preserves its selected collected/relevant scope through GET search parameters; the relevant scope is deterministic-only.

The evaluation route prioritizes compact compatible opportunities, with score, warnings, decision state, and Gemini state visible before expandable deterministic details. Rejected jobs are a secondary, on-demand diagnostic list. Evaluation loads per-profile decisions in one query and latest Gemini analyses for compatible jobs in one query; it does not cache mutable decisions or analyses. Saving a decision no longer revalidates and re-renders the full evaluation route because the action response already carries the persisted decision state.

## Not implemented

Automatic learning, Lever collection, notifications, authentication/RLS, and analytics are not implemented. Job actions do not trigger AI, notifications, or automatic applications.

## Scheduled collection foundation

Manual and scheduled collection share one server-side orchestration. GitHub Actions requests the protected scheduler route approximately hourly; it may be delayed and has not been validated in production. Collection runs are persisted, support partial failure, and enabled Lever configurations are safely skipped. Jobs close after three successful absences and reopen when seen again. Gemini, decisions, and notifications are never automatic. Companies provides “Executar coleta agora” and a compact last-run status.

The scheduler workflow supports `workflow_dispatch` and uses only the repository-secret names `ROLEPILOT_SCHEDULER_URL` and `SCHEDULER_SECRET`. Migration `202608100001_collection_runs_and_job_lifecycle.sql` is created but **not applied remotely**. Live scheduled execution has **not** been performed.

## Migrations

`202607290001_create_candidate_profiles.sql`, `202607290002_create_target_companies.sql`, `202607290003_create_jobs.sql`, `202608060001_create_job_user_statuses.sql`, and `202608090001_create_job_ai_analyses.sql`.

## External integrations

Greenhouse é manual e somente leitura até o salvamento explícito. A prévia normaliza descrições como texto simples; registros antigos que preservaram marcação precisam ser coletados novamente para ficar limpos. A coleta importa o painel publicado inteiro e a compatibilidade é calculada depois para cada perfil. Supabase stores product data. Gemini analysis is manual and advisory.

## Current milestone

Compact evaluation workflow and decision feedback after real-data manual smoke-test validation.

## Next approved milestone

No next milestone is approved in this document.

## Collection classification

Os resultados e o histórico de coleta contam “atualizadas” apenas quando o conteúdo
material normalizado da fonte muda. A renovação de `last_seen_at` e a manutenção ou
reativação de ciclo de vida são persistidas, mas contam como “sem alteração” quando o
conteúdo da vaga é o mesmo.
