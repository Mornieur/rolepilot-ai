# Arquitetura

Next.js App Router organiza recursos por domínio. Supabase guarda perfis, empresas e vagas. Adaptadores de fonte são específicos do provider, mas a vaga normalizada é independente. Fluxo: coleta → normalização → deduplicação → filtro determinístico → interpretação de IA → ações/notificações futuras.

Veja [fontes](SOURCE_STRATEGY.md), [agendamento](SCHEDULING_STRATEGY.md) e [métricas](METRICS_AND_INSIGHTS.md).
