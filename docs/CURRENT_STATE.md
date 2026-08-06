# Current State

## Repository
- Branch: `feat/structured-ai-analysis`; commit: `c3e4bbc feat: add manual structured AI job analysis`.
- Árvore: documentação não commitada.

## Runtime provider
- Aprovado: Gemini Developer API free tier.
- Atual: OpenAI Responses API (`openai`, `OPENAI_API_KEY`, `OPENAI_MODEL`).
- Status: transitório, não aprovado para MVP ao vivo; validação ao vivo pendente.

## Implemented
Perfis, empresas, preview Greenhouse, coleta manual com re-fetch, deduplicação, vagas persistidas, filtro determinístico e análise estruturada manual técnica.

## Transitional or partial
OpenAI manual não persistido; UI atual limita análise a elegíveis, diferente da política futura de análise manual para qualquer vaga.

## Not implemented
Gemini, agendamento, Lever, ações de vaga, persistência de análise, notificações, FeitozaUI, Auth/RLS e métricas.

## Migrations
`202607290001_create_candidate_profiles.sql`, `...002_create_target_companies.sql`, `...003_create_jobs.sql`.

## External integrations
Greenhouse manual, Supabase e OpenAI transitório; nenhuma chamada ao vivo validada.

## Last validation
Typecheck, lint, 44 testes, build e diff check passaram anteriormente.

## Current milestone
Fonte de verdade consolidada.

## Next approved milestone
Migrar o runtime transitório para Gemini free tier e validar uma análise real.
