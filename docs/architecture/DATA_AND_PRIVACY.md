# Dados e privacidade

Opportunity dossiers are profile-owned. They persist only validated result data, citation metadata and bounded normalized excerpts: never raw HTML, Tavily/Gemini bodies, prompts, keys or provider error bodies. `TAVILY_API_KEY` stays server-only.

Minimizar dados enviados à IA; nunca enviar credenciais. Histórico futuro cobre coletas, mudanças, notificações, análises e ações. Empresas devem ser arquivadas para parar coleta e preservar vagas; o `ON DELETE CASCADE` atual deve ser revisto antes de histórico ter valor. Vagas fechadas ficam 180 dias; descrições cruas podem ser removidas mantendo agregados.

Perfis, decisões, análises Gemini persistidas e eventos de notificação são isolados pela propriedade do perfil. Admin pode inspecioná-los para operação, sem expor segredos ou payloads de provedores. Empresas monitoradas, vagas coletadas e histórico de coleta são uma fonte compartilhada: uma vaga nunca é duplicada por usuário.
