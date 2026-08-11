# Matching

Política conservadora-moderada: `required` tem cobertura mínima de 50% e cobertura parcial gera aviso, não aprovação silenciosa; `high` e `preferred` elevam prioridade; `neutral` não altera; `negative` reduz; `blocked` rejeita. Papéis frontend adjacentes são aceitos apenas com evidência tokenizada de frontend/UI/web/React. Senioridade e localização divergentes geram aviso; modelo de trabalho explicitamente incompatível rejeita. Valores desconhecidos são neutros. Regras determinísticas e interpretação IA são camadas distintas.

# Diagnóstico administrativo

`/insights/matching` é uma superfície operacional somente para administradores.
Ela descreve o resultado atual de `evaluateJob` e decisões explícitas por perfil;
nunca muda limiares, pesos, elegibilidade, perfil ou decisões, e não aprende com
os resultados. Candidatos suspeitos são apenas grupos de revisão textual.
