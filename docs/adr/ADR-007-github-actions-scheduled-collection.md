# ADR-007 — GitHub Actions para coleta agendada

GitHub Actions chama a rota protegida do RolePilot aproximadamente a cada hora e também oferece `workflow_dispatch`. A escolha não exige computador ligado nem nova infraestrutura. Vercel Hobby limita cron a uma execução diária; Supabase Cron fica adiado para evitar ativação/configuração adicional.

O workflow usa somente `ROLEPILOT_SCHEDULER_URL` e `SCHEDULER_SECRET`. Horários são aproximados e podem atrasar. A rota chama a orquestração compartilhada, que grava histórico seguro, isola falhas e fecha vagas somente após três ausências em coletas bem-sucedidas. Não há Gemini automático nem notificações.
