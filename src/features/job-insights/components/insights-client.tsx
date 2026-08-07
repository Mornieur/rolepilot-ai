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
}: {
  profiles: CandidateProfile[];
  profileId?: string;
  period: InsightPeriod;
}) {
  return (
    <form className="mt-6 flex flex-wrap gap-4">
      <label>
        Candidate profile
        <Select name="profileId" defaultValue={profileId} className="ml-2">
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Period
        <Select name="period" defaultValue={period} className="ml-2">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All history</option>
        </Select>
      </label>
      <Button type="submit">Update insights</Button>
    </form>
  );
}

export function InsightsEmpty() {
  return <Card className="mt-6 p-5">No collected jobs exist for this period.</Card>;
}
