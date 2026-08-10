import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/features/profiles/server/supabase';

const accessTokenCookie = 'rolepilot-access-token';
const refreshTokenCookie = 'rolepilot-refresh-token';

export type CurrentUser = {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  displayName: string | null;
};
export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Autenticação necessária.');
  }
}
export class AuthorizationError extends Error {
  constructor() {
    super('Você não tem permissão para esta operação.');
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) return null;
  const client = getSupabaseServerClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const account = await client
    .from('app_users')
    .select('role, display_name')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (account.error || !account.data) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: account.data.role === 'admin' ? 'admin' : 'user',
    displayName: account.data.display_name,
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}
export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
export function requireAdmin(user: CurrentUser) {
  if (user.role !== 'admin') throw new AuthorizationError();
}

export async function setAuthSession(session: { access_token: string; refresh_token: string }) {
  const store = await cookies();
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
  store.set(accessTokenCookie, session.access_token, options);
  store.set(refreshTokenCookie, session.refresh_token, options);
}
export async function clearAuthSession() {
  const store = await cookies();
  store.delete(accessTokenCookie);
  store.delete(refreshTokenCookie);
}
