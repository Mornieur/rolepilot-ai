import { logoutAction } from '@/features/auth/actions';
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="rounded border px-3 py-2 text-sm">
        Sair
      </button>
    </form>
  );
}
