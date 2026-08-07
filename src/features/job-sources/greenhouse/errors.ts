export type GreenhouseErrorCode =
  'invalid-board' | 'not-found' | 'timeout' | 'unavailable' | 'invalid-response';

const messages: Record<GreenhouseErrorCode, string> = {
  'invalid-board':
    'The configured Greenhouse board identifier is invalid. Review the token in the company settings.',
  'not-found':
    'The configured Greenhouse board identifier could not be found. Review the token in the company settings.',
  timeout: 'Greenhouse did not respond in time. Please try the preview again.',
  unavailable: 'Greenhouse is temporarily unavailable. Please try again.',
  'invalid-response': 'Greenhouse returned an unexpected response. Please try again later.',
};

export class GreenhouseError extends Error {
  constructor(public readonly code: GreenhouseErrorCode) {
    super(messages[code]);
  }
}
