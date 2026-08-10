'use client';
import { useActionState } from 'react';
import { Button, Input } from '@/components/feitoza-ui';
import { loginAction, type LoginActionState } from '@/features/auth/actions';
const initial: LoginActionState = { status: 'idle' };
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Input
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        fullWidth
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        required
        fullWidth
      />
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
