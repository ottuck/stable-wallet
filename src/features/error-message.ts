import { errorCode } from '@/core/errors';

import { currentMessages } from './i18n';

export function errorMessage(error: unknown): string {
  return currentMessages().errors[errorCode(error)];
}
