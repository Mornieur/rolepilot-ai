import 'server-only';

import type { JobNotificationErrorClassification } from '@/features/job-notifications/types';

const telegramApiBase = 'https://api.telegram.org';
const timeoutMs = 8_000;

export class TelegramDeliveryError extends Error {
  constructor(public readonly classification: JobNotificationErrorClassification) {
    super('Telegram delivery failed.');
  }
}

export type TelegramMessage = { chatId: string; text: string };

export async function sendTelegramMessage({ chatId, text }: TelegramMessage): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) throw new TelegramDeliveryError('configuration');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${telegramApiBase}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });
    if (response.ok) return;
    if (response.status === 400) throw new TelegramDeliveryError('bad_request');
    if (response.status === 401 || response.status === 403)
      throw new TelegramDeliveryError('unauthorized');
    if (response.status === 429) throw new TelegramDeliveryError('rate_limit');
    if (response.status >= 500) throw new TelegramDeliveryError('telegram_unavailable');
    throw new TelegramDeliveryError('unknown');
  } catch (error) {
    if (error instanceof TelegramDeliveryError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new TelegramDeliveryError('timeout');
    throw new TelegramDeliveryError('telegram_unavailable');
  } finally {
    clearTimeout(timer);
  }
}
