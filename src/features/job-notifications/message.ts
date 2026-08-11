import type { TargetCompany, PersistedJob } from '@/types/domain';
import type { JobNotificationEvent } from '@/features/job-notifications/types';

const maxTelegramLength = 4096;
const priorityLabels = { excellent: 'Excelente', good: 'Boa', review: 'Revisar' } as const;
const compact = (value: string | null | undefined, max = 240) =>
  (value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function rolePilotUrl(profileId: string) {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) return null;
  try {
    const url = new URL('/inbox', value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.searchParams.set('profileId', profileId);
    return url.toString();
  } catch {
    return null;
  }
}

export function formatTelegramJobNotification(
  event: JobNotificationEvent,
  job: PersistedJob,
  company: TargetCompany | null,
) {
  const lines = [
    'Nova vaga compatível',
    '',
    `Empresa: ${compact(company?.name, 160) || 'Empresa monitorada'}`,
    `Cargo: ${compact(job.title, 240) || 'Vaga sem título'}`,
    `Local: ${compact(job.location, 160) || 'Não informado'}`,
    `Pontuação: ${event.deterministicScore}/100`,
    `Prioridade: ${priorityLabels[event.priority]}`,
    '',
    'Abrir vaga:',
    compact(job.originalUrl, 1_500),
  ];
  const appUrl = rolePilotUrl(event.profileId);
  if (appUrl) lines.push('', 'RolePilot:', appUrl);
  return lines.join('\n').slice(0, maxTelegramLength);
}
