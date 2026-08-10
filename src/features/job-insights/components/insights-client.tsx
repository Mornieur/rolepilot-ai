'use client';

import { Button, Card, Select, Surface } from '@feitoza-ui/core';
import type { CandidateProfile } from '@/types/domain';
import type { InsightPeriod } from '../periods';

export function InsightsClient({ children }: { children: React.ReactNode }) {
  return <Surface className="mx-auto max-w-6xl p-6">{children}</Surface>;
}

export function InsightsFilters({
  profiles,
  profileId,
  period,
  scope = 'all',
}: {
  profiles: CandidateProfile[];
  profileId?: string;
  period: InsightPeriod;
  scope?: 'all' | 'relevant';
}) {
  return (
    <form className="mt-6 flex flex-wrap gap-4">
      <label>
        Perfil
        <Select name="profileId" defaultValue={profileId} className="ml-2">
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Vagas
        <Select name="scope" defaultValue={scope} className="ml-2">
          <option value="all">Todas coletadas</option>
          <option value="relevant">Compatíveis com o perfil</option>
        </Select>
      </label>
      <label>
        Período
        <Select name="period" defaultValue={period} className="ml-2">
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="all">Todo o histórico</option>
        </Select>
      </label>
      <Button type="submit">Atualizar insights</Button>
    </form>
  );
}

export function InsightsEmpty() {
  return <Card className="mt-6 p-5">Não há vagas coletadas neste período.</Card>;
}
