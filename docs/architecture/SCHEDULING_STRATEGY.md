# Agendamento

Coleta automática usa GitHub Actions agendado aproximadamente a cada hora (minuto 17 UTC) para chamar uma rota protegida do app. O horário é aproximado: agendamentos do GitHub podem atrasar. `workflow_dispatch` permite disparo manual do workflow. Os segredos necessários são somente `ROLEPILOT_SCHEDULER_URL` e `SCHEDULER_SECRET`.

GitHub Actions foi escolhido porque não exige computador ligado nem serviço adicional. Vercel Hobby permite cron somente diário; Supabase Cron exigiria ativação/configuração de infraestrutura no projeto. Não há promessa de minuto exato, cobrança ativada nem retry automático.

O scheduler chama a mesma orquestração usada pela coleta manual. Ela coleta apenas empresas habilitadas com provider Greenhouse, isola falhas por empresa e nunca chama Gemini ou notificações. Há proteção de uma execução `running` por vez. Vagas ausentes são fechadas apenas após três coletas bem-sucedidas consecutivas da mesma empresa; uma falha não conta como ausência e reaparições reativam a vaga.

Em toda observação bem-sucedida de uma vaga presente, `last_seen_at` é renovado e a
ausência acumulada é zerada. Reaparecimentos também reativam a vaga e limpam `closed_at`,
sem criar duplicata e preservando `first_seen_at`. Essas são alterações operacionais: a
coleta as registra, mas conta a vaga como “sem alteração” quando seu conteúdo de fonte
não mudou. `collection_runs.updated_count` significa exclusivamente conteúdo material da
fonte atualizado.
