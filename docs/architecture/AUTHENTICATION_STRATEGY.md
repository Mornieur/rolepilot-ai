# Autenticação, propriedade e RLS

RolePilot usa Supabase Auth com e-mail e senha. Não há cadastro público, OAuth ou inferência de papel por e-mail. Maria e Flávia recebem contas criadas manualmente; `public.app_users` associa cada `auth.users.id` a `display_name` e ao papel persistido `user` ou `admin`.

`candidate_profiles` é user-owned. `job_user_statuses`, `job_ai_analyses` e `job_notification_events` são dados derivados do perfil; `target_companies` e `jobs` são compartilhados e `collection_runs` é operacional. RLS permite ao usuário acessar somente seus perfis/dados derivados, com override para `app_users.role = 'admin'`; empresas, vagas e execuções têm apenas leitura para usuários autenticados.

`SUPABASE_SERVICE_ROLE_KEY` permanece server-only e ignora RLS. Cada mutação de usuário resolve a sessão e recarrega propriedade/papel; scheduler, coleta e worker Telegram continuam caminhos de sistema com service role e bearer próprio.

Em `/insights`, a página resolve primeiro a lista de perfis autorizados para a sessão e seleciona o `profileId` somente dessa lista antes de carregar decisões ou outros dados derivados. Assim, o cliente service-role usado pelos repositórios não pode transformar um `profileId` arbitrário da URL em acesso a dados privados; perfis ausentes e não autorizados seguem a mesma resposta controlada.

## Rollout completed

1. Aplicar `202608110001_auth_ownership_and_rls_foundation.sql`; `candidate_profiles.user_id` começa anulável e nada é atribuído automaticamente.
2. Criar manualmente as contas Auth de Maria e Flávia e obter UUIDs de forma segura.
3. Inserir explicitamente `app_users` (Maria como `admin`) e executar/revisar o backfill de cada perfil.
4. Verificar que nenhum perfil produtivo permanece sem dono, publicar a aplicação com `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e testar login, isolamento e admin.
5. Só em migração futura tornar `user_id not null`.

As rotas interativas não usam HTTP Basic: uma requisição sem sessão é redirecionada para `/login`, e as páginas e ações confirmam a sessão e o papel no servidor. Ações manuais de coleta Greenhouse exigem `admin`. `/api/collection/scheduled` e `/api/notifications/deliver` permanecem fora do fluxo de usuário e exigem exclusivamente seus bearers independentes.
