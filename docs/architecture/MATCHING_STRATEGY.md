# Matching

Política conservadora-moderada: `required` tem cobertura mínima de 50% e cobertura parcial gera aviso, não aprovação silenciosa; `preferred` eleva prioridade; `excluded` bloqueia. Para perfis frontend, títulos diretos incluem `Frontend`/`Front-end` e `UI Engineer`; títulos adjacentes (`Software Engineer`, Full Stack, Web e Design System Engineer) exigem evidência de requisitos frontend fora do título. `UI Designer` é design, não engenharia frontend. Senioridade e localização divergentes geram aviso; modelo de trabalho explicitamente incompatível rejeita. Valores desconhecidos são neutros. Regras determinísticas e interpretação IA são camadas distintas.

# Diagnóstico administrativo

`/insights/matching` é uma superfície operacional somente para administradores. Ela descreve o resultado atual de `evaluateJob` e decisões explícitas por perfil; nunca muda limiares, pesos, elegibilidade, perfil ou decisões, e não aprende com os resultados. Um possível falso negativo precisa ter uma família de título frontend/adjacente, evidência frontend e exatamente um bloqueio duro; uma menção isolada de frontend em vaga de Sales, Support ou Design não basta.
