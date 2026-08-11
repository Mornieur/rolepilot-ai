export type TelegramTestActionState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export const initialTelegramTestActionState: TelegramTestActionState = { status: 'idle' };
