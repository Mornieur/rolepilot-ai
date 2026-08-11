import 'server-only';

const cooldownMs = 60_000;
const lastTestSendByAdmin = new Map<string, number>();

export function canSendTelegramTest(userId: string, now = Date.now()) {
  const previous = lastTestSendByAdmin.get(userId);
  if (previous && now - previous < cooldownMs) return false;
  lastTestSendByAdmin.set(userId, now);
  return true;
}

export function resetTelegramTestCooldownForTests() {
  lastTestSendByAdmin.clear();
}
