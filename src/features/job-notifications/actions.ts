'use server';

import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAdmin,
  requireCurrentUser,
} from '@/features/auth/server/auth';
import { TelegramDeliveryError, sendTelegramMessage } from '@/features/job-notifications/telegram';
import { canSendTelegramTest } from '@/features/job-notifications/server/telegram-test-cooldown';
import type { TelegramTestActionState } from '@/features/job-notifications/telegram-test-action-state';

const testMessage =
  '✅ RolePilot AI\n\nCanal de notificações configurado com sucesso.\n\nEste é um teste de integração.';
export async function sendTelegramTestAction(
  _: TelegramTestActionState,
): Promise<TelegramTestActionState> {
  void _;
  try {
    const user = await requireCurrentUser();
    requireAdmin(user);
    if (!canSendTelegramTest(user.id))
      return { status: 'error', message: 'Aguarde um minuto antes de enviar outro teste.' };
    await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID ?? '', text: testMessage });
    return { status: 'success', message: 'Mensagem de teste enviada ao Telegram.' };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError)
      return { status: 'error', message: 'Faça login para enviar uma mensagem de teste.' };
    if (error instanceof AuthorizationError)
      return {
        status: 'error',
        message: 'Você não tem permissão para enviar uma mensagem de teste.',
      };
    if (error instanceof TelegramDeliveryError && error.classification === 'configuration')
      return { status: 'error', message: 'Telegram não está configurado no ambiente.' };
    return { status: 'error', message: 'Não foi possível enviar a mensagem de teste.' };
  }
}
