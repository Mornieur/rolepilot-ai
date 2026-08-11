'use server';

import { AuthorizationError, requireAdmin, requireCurrentUser } from '@/features/auth/server/auth';
import { TelegramDeliveryError, sendTelegramMessage } from '@/features/job-notifications/telegram';

const testMessage =
  '✅ RolePilot AI\n\nCanal de notificações configurado com sucesso.\n\nEste é um teste de integração.';
const cooldownMs = 60_000;
const lastTestSendByAdmin = new Map<string, number>();

export type TelegramTestActionState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export const initialTelegramTestActionState: TelegramTestActionState = { status: 'idle' };

export async function sendTelegramTestAction(
  _: TelegramTestActionState,
): Promise<TelegramTestActionState> {
  void _;
  const user = await requireCurrentUser();
  requireAdmin(user);
  const now = Date.now();
  const previous = lastTestSendByAdmin.get(user.id);
  if (previous && now - previous < cooldownMs)
    return { status: 'error', message: 'Aguarde um minuto antes de enviar outro teste.' };
  lastTestSendByAdmin.set(user.id, now);
  try {
    await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID ?? '', text: testMessage });
    return { status: 'success', message: 'Mensagem de teste enviada ao Telegram.' };
  } catch (error) {
    if (error instanceof TelegramDeliveryError && error.classification === 'configuration')
      return { status: 'error', message: 'Telegram não está configurado no ambiente.' };
    if (error instanceof AuthorizationError) throw error;
    return { status: 'error', message: 'Não foi possível enviar a mensagem de teste.' };
  }
}

export async function resetTelegramTestCooldownForTests() {
  lastTestSendByAdmin.clear();
}
