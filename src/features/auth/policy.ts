export type AccessActor = { id: string; role: 'admin' | 'user' };
export function canAccessProfile(actor: AccessActor, ownerId: string | null | undefined) {
  return actor.role === 'admin' || ownerId === actor.id;
}

export function selectAccessibleProfile<T extends { id: string }>(
  profiles: T[],
  requestedProfileId?: string,
): T | null {
  if (!requestedProfileId) return profiles[0] ?? null;
  return profiles.find((profile) => profile.id === requestedProfileId) ?? null;
}
