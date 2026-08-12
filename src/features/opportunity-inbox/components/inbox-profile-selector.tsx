'use client';

import { useRouter } from 'next/navigation';
import { Select } from '@/components/feitoza-ui';

type InboxProfileOption = { id: string; name: string };

export function InboxProfileSelector({
  profiles,
  profileId,
}: {
  profiles: InboxProfileOption[];
  profileId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      id="profileId"
      name="profileId"
      label="Perfil"
      defaultValue={profileId ?? ''}
      fullWidth
      onChange={(event) =>
        router.push(`/inbox?profileId=${encodeURIComponent(event.currentTarget.value)}`)
      }
    >
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.name}
        </option>
      ))}
    </Select>
  );
}
