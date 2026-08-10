export class AiJobAnalysisError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export const aiError = {
  configuration: () => new AiJobAnalysisError('A análise de IA não está configurada.'),
  profile: () => new AiJobAnalysisError('Perfil não encontrado.'),
  job: () => new AiJobAnalysisError('Vaga salva não encontrada.'),
  ineligible: () =>
    new AiJobAnalysisError('A análise de IA está disponível apenas para vagas elegíveis.'),
  timeout: () => new AiJobAnalysisError('A análise de IA expirou. Tente novamente.'),
  rateLimit: () =>
    new AiJobAnalysisError(
      'A análise de IA está temporariamente limitada. Tente novamente mais tarde.',
    ),
  refused: () => new AiJobAnalysisError('A análise de IA foi recusada. Revise a vaga manualmente.'),
  invalid: () =>
    new AiJobAnalysisError('A análise de IA retornou um resultado estruturado inválido.'),
  persistence: () => new AiJobAnalysisError('A análise de IA não pôde ser salva. Tente novamente.'),
  unavailable: () =>
    new AiJobAnalysisError('A análise de IA está temporariamente indisponível. Tente novamente.'),
};
