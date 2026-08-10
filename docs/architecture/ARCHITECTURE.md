# Arquitetura

Next.js App Router organiza recursos por domínio. Supabase guarda perfis, empresas, vagas, execuções de coleta e eventos de notificação. Adaptadores de fonte são específicos do provider, mas a vaga normalizada é independente. Fluxo: coleta → normalização → deduplicação → persistência → candidatos de notificação determinísticos para vagas novas → filtro determinístico sob demanda → interpretação de IA manual → ações.

`job_notification_events` é uma outbox durável, isolada por perfil/vaga/tipo de evento. Ela é criada depois da persistência bem-sucedida e não participa da transação ou do sucesso da coleta; falhas na geração ficam registradas de forma segura no resultado da execução. Não há worker nem canal de entrega nesta fase.

Veja [fontes](SOURCE_STRATEGY.md), [agendamento](SCHEDULING_STRATEGY.md) e [métricas](METRICS_AND_INSIGHTS.md).
