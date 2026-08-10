import { timingSafeEqual } from 'node:crypto';

export const personalAccessRealm = 'RolePilot personal MVP';

export function isPersonalAccessAuthorized(
  authorization: string | null,
  secret = process.env.PERSONAL_ACCESS_SECRET,
) {
  if (!secret || !authorization) return false;
  const encoded = authorization.match(/^Basic\s+(.+)$/i)?.[1];
  if (!encoded) return false;

  const expected = Buffer.from(`rolepilot:${secret}`);
  const received = Buffer.from(encoded, 'base64');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function personalAccessChallenge() {
  return `Basic realm="${personalAccessRealm}", charset="UTF-8"`;
}
