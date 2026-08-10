import { redirect } from 'next/navigation';
import { Surface } from '@/components/feitoza-ui';
import { LoginForm } from '@/features/auth/components/login-form';
import { getCurrentUser } from '@/features/auth/server/auth';
export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');
  return (
    <main className="flex min-h-screen items-center bg-slate-50 px-4 dark:bg-slate-950">
      <Surface className="mx-auto w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold">Entrar no RolePilot</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Use a conta criada pela administração.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Surface>
    </main>
  );
}
