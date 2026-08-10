import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { TelegramDeliveryError, sendTelegramMessage } from './telegram';

describe('Telegram adapter', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '123';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  it('sends the configured chat id to the Bot API without leaking the token in assertions', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await sendTelegramMessage({ chatId: '123', text: 'Olá <b>não é HTML</b>' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https:\/\/api\.telegram\.org\/bot.+\/sendMessage$/);
    expect(String(url)).toMatch(/sendMessage$/);
    expect(JSON.parse(options.body)).toEqual({
      chat_id: '123',
      text: 'Olá <b>não é HTML</b>',
      disable_web_page_preview: true,
    });
  });
  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [429, 'rate_limit'],
    [400, 'bad_request'],
    [500, 'telegram_unavailable'],
  ] as const)('classifies HTTP %i safely', async (status, classification) => {
    fetchMock.mockResolvedValue(new Response('', { status }));
    await expect(sendTelegramMessage({ chatId: '123', text: 'x' })).rejects.toMatchObject({
      classification,
    } satisfies Partial<TelegramDeliveryError>);
  });
  it('classifies network errors without provider response bodies', async () => {
    fetchMock.mockRejectedValue(new Error('network details'));
    await expect(sendTelegramMessage({ chatId: '123', text: 'x' })).rejects.toMatchObject({
      classification: 'telegram_unavailable',
    });
  });
  it('classifies an aborted request as a timeout', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    await expect(sendTelegramMessage({ chatId: '123', text: 'x' })).rejects.toMatchObject({
      classification: 'timeout',
    });
  });
  it('fails safely when configuration is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(sendTelegramMessage({ chatId: '123', text: 'x' })).rejects.toMatchObject({
      classification: 'configuration',
    });
  });
});
