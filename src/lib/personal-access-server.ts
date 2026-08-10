import 'server-only';

import { headers } from 'next/headers';

import { isPersonalAccessAuthorized } from '@/lib/personal-access';

export class PersonalAccessDeniedError extends Error {
  constructor() {
    super('Personal access is required.');
  }
}

export async function requirePersonalAccess() {
  if (!process.env.PERSONAL_ACCESS_SECRET) return;
  const requestHeaders = await headers();
  if (!isPersonalAccessAuthorized(requestHeaders.get('authorization')))
    throw new PersonalAccessDeniedError();
}
