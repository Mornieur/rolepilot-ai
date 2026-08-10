# Arquitetura

Next.js App Router organiza recursos por domínio. Supabase guarda perfis, empresas, vagas, execuções de coleta e eventos de notificação. Adaptadores de fonte são específicos do provider, mas a vaga normalizada é independente. Fluxo: coleta → normalização → deduplicação → persistência → candidatos de notificação determinísticos para vagas novas → filtro determinístico sob demanda → interpretação de IA manual → ações.

O caminho interativo resolve uma sessão Supabase Auth no servidor e aplica propriedade por perfil/papel persistido antes de cada mutação. O caminho de sistema continua server-only com service role: coleta agendada e entrega Telegram não dependem de sessão de usuário. Empresas e vagas são uma fonte compartilhada; perfis e seus dados derivados são isolados. Veja `AUTHENTICATION_STRATEGY.md`.

`job_notification_events` é uma outbox durável, isolada por perfil/vaga/tipo de evento. Ela é criada depois da persistência bem-sucedida e não participa da transação ou do sucesso da coleta; falhas na geração ficam registradas de forma segura no resultado da execução. Um worker Telegram server-only consome lotes limitados de pendentes por uma rota protegida independente; o resultado de entrega não muda o resultado da coleta e Gemini continua somente manual.

Veja [fontes](SOURCE_STRATEGY.md), [agendamento](SCHEDULING_STRATEGY.md) e [métricas](METRICS_AND_INSIGHTS.md).
