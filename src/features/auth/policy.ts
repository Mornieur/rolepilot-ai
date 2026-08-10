export type AccessActor = { id: string; role: 'admin' | 'user' };
export function canAccessProfile(actor: AccessActor, ownerId: string | null | undefined) {
  return actor.role === 'admin' || ownerId === actor.id;
}
