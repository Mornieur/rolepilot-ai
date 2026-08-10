# Estratégia de fontes

Busca ampla é objetivo; empresas-alvo complementam. Adaptadores por provider normalizam vagas. Greenhouse é atual; Lever/APIs permitidas são futuros. URL/texto manual é permitido. LinkedIn somente por integração estável e permitida; não há scraping proibido.

A prévia e o salvamento do Greenhouse são manuais. A coleta traz todo o painel público da fonte, sem filtrar pelo perfil ativo; a compatibilidade é aplicada depois por perfil. Descrições são armazenadas e exibidas como texto simples normalizado, sem HTML do provider. Registros antigos podem exigir uma nova coleta para receber a normalização atual.

Os contadores da coleta distinguem alterações de conteúdo da fonte de observações do
RolePilot. Uma vaga é “atualizada” somente quando um campo material do provider muda:
título, descrição, localização, departamentos, escritórios, URL original,
`source_updated_at`, idioma ou outro campo normalizado pertencente à fonte. Timestamps
equivalentes de `source_updated_at` são comparados como instantes, não como texto.
Atualizar `last_seen_at`, `updated_at` interno ou campos de ciclo de vida não muda esse
contador; nesses casos a vaga continua “sem alteração”.
