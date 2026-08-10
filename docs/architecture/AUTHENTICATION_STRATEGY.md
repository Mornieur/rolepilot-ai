# Autenticação, propriedade e RLS

RolePilot usa Supabase Auth com e-mail e senha. Não há cadastro público, OAuth ou inferência de papel por e-mail. Maria e Flávia recebem contas criadas manualmente; `public.app_users` associa cada `auth.users.id` a `display_name` e ao papel persistido `user` ou `admin`.

`candidate_profiles` é user-owned. `job_user_statuses`, `job_ai_analyses` e `job_notification_events` são dados derivados do perfil; `target_companies` e `jobs` são compartilhados e `collection_runs` é operacional. RLS permite ao usuário acessar somente seus perfis/dados derivados, com override para `app_users.role = 'admin'`; empresas, vagas e execuções têm apenas leitura para usuários autenticados.

`SUPABASE_SERVICE_ROLE_KEY` permanece server-only e ignora RLS. Cada mutação de usuário resolve a sessão e recarrega propriedade/papel; scheduler, coleta e worker Telegram continuam caminhos de sistema com service role e bearer próprio.

## Rollout staged

1. Aplicar `202608110001_auth_ownership_and_rls_foundation.sql`; `candidate_profiles.user_id` começa anulável e nada é atribuído automaticamente.
2. Criar manualmente as contas Auth de Maria e Flávia e obter UUIDs de forma segura.
3. Inserir explicitamente `app_users` (Maria como `admin`) e executar/revisar o backfill de cada perfil.
4. Verificar que nenhum perfil produtivo permanece sem dono, publicar a aplicação com `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e testar login, isolamento e admin.
5. Só em migração futura tornar `user_id not null`.

O HTTP Basic temporário (`PERSONAL_ACCESS_SECRET`) continua na Fase 1 e convive com Auth. A Fase 2, removê-lo das páginas de usuário, exige validação em produção e decisão explícita. `/api/collection/scheduled` e `/api/notifications/deliver` ficam fora dele e requerem seus bearers independentes.
