# ADR 0008: Supabase Auth, propriedade por perfil e RLS

## Decisão

Adotar Supabase Auth por e-mail/senha sem signup público. Persistir papel em `app_users`, adicionar `candidate_profiles.user_id` de forma anulável e derivar autorização das tabelas filhas por `profile_id`. Habilitar RLS e manter service role apenas para caminhos de sistema.

## Consequências

Não há organizações, convites ou OAuth. A migração exige criação e backfill manual e verificável das duas contas existentes. O login não substitui, nesta fase, o HTTP Basic temporário.
