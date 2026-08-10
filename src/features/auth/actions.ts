'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import { clearAuthSession, setAuthSession } from '@/features/auth/server/auth';

export type LoginActionState = { status: 'idle' | 'error'; message?: string };
const credentials = z.object({ email: z.string().email(), password: z.string().min(1) });
function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function loginAction(
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success)
    return { status: 'error', message: 'Informe um e-mail e uma senha válidos.' };
  const authClient = getSupabaseAuthClient();
  if (!authClient)
    return { status: 'error', message: 'O login não está configurado neste ambiente.' };
  const { data, error } = await authClient.auth.signInWithPassword(parsed.data);
  if (error || !data.session)
    return { status: 'error', message: 'Não foi possível entrar com estas credenciais.' };
  const account = await getSupabaseServerClient()
    .from('app_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (account.error || !account.data)
    return { status: 'error', message: 'Esta conta ainda não está habilitada para o RolePilot.' };
  await setAuthSession(data.session);
  redirect('/');
}
export async function logoutAction() {
  await clearAuthSession();
  redirect('/login');
}
