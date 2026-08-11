import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => {
  class AuthenticationRequiredError extends Error {}
  class AuthorizationError extends Error {}
  class TelegramDeliveryError extends Error {
    constructor(public classification: string) {
      super();
    }
  }
  return {
    user: vi.fn(),
    send: vi.fn(),
    AuthenticationRequiredError,
    AuthorizationError,
    TelegramDeliveryError,
  };
});
vi.mock('server-only', () => ({}));
vi.mock('@/features/auth/server/auth', () => ({
  AuthenticationRequiredError: deps.AuthenticationRequiredError,
  AuthorizationError: deps.AuthorizationError,
  requireCurrentUser: deps.user,
  requireAdmin: (user: { role: string }) => {
    if (user.role !== 'admin') throw new deps.AuthorizationError();
  },
}));
vi.mock('@/features/job-notifications/telegram', () => ({
  TelegramDeliveryError: deps.TelegramDeliveryError,
  sendTelegramMessage: deps.send,
}));
import { sendTelegramTestAction } from './actions';
import { resetTelegramTestCooldownForTests } from './server/telegram-test-cooldown';
import { initialTelegramTestActionState } from './telegram-test-action-state';

describe('sendTelegramTestAction', () => {
  beforeEach(async () => {
    deps.user.mockReset();
    deps.send.mockReset();
    await resetTelegramTestCooldownForTests();
  });
  it('sends the fixed integration test only for an admin', async () => {
    deps.user.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    deps.send.mockResolvedValue(undefined);
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toMatchObject({
      status: 'success',
    });
    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('RolePilot AI') }),
    );
    expect(JSON.stringify(deps.send.mock.calls)).not.toContain('TELEGRAM_BOT_TOKEN');
  });
  it('returns controlled denials for normal and anonymous users before calling Telegram', async () => {
    deps.user.mockResolvedValue({ id: 'user-1', role: 'user' });
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toMatchObject({
      status: 'error',
      message: expect.stringContaining('permissão'),
    });
    deps.user.mockRejectedValue(new deps.AuthenticationRequiredError());
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toMatchObject({
      status: 'error',
      message: expect.stringContaining('login'),
    });
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('returns a controlled missing-configuration failure without writing product data', async () => {
    deps.user.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    deps.send.mockRejectedValue(new deps.TelegramDeliveryError('configuration'));
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toEqual({
      status: 'error',
      message: 'Telegram não está configurado no ambiente.',
    });
  });
  it('returns a controlled provider failure and applies the cooldown', async () => {
    deps.user.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    deps.send.mockRejectedValue(new Error('provider response body'));
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toEqual({
      status: 'error',
      message: 'Não foi possível enviar a mensagem de teste.',
    });
    await expect(sendTelegramTestAction(initialTelegramTestActionState)).resolves.toMatchObject({
      message: expect.stringContaining('Aguarde um minuto'),
    });
    expect(deps.send).toHaveBeenCalledOnce();
  });
});
