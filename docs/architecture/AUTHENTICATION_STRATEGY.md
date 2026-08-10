# Autenticação

O MVP local não possui autenticação e não é multiusuário seguro. Antes de dados reais em ambiente público: Supabase Auth, ownership por usuário, RLS e eventual papel administrativo para Maria. Demo pública deve usar dados fictícios; service role permanece server-only.

Enquanto o agendador é validado em uma implantação pessoal, a UI usa uma barreira temporária
server-side de HTTP Basic com `PERSONAL_ACCESS_SECRET`. Ela não é autenticação de usuário e não
substitui Auth/RLS; apenas impede exposição anônima das superfícies atuais. A rota
`/api/collection/scheduled` fica fora dessa barreira e mantém sua autenticação Bearer independente
por `SCHEDULER_SECRET`.
