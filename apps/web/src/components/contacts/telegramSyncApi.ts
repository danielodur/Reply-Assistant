import type { ContactThread } from '../../config/contactThreads';
import { type EmailSyncResponse, isEmailSyncResponse } from './emailSyncTypes';

export type TelegramSyncRequest = {
  syncConfig: {
    botToken: string;
    chatId?: string;
    maxMessages?: number;
  };
  contacts: ContactThread[];
  targetContactId: string;
};

const TELEGRAM_SYNC_TIMEOUT_MS = 20000;

function getTelegramSyncEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? ['http://localhost:4011/api/telegram/sync', 'http://localhost:4000/api/telegram/sync', '/api/telegram/sync']
    : ['/api/telegram/sync', 'http://localhost:4000/api/telegram/sync'];

  return [...new Set(endpointCandidates)];
}

export async function requestTelegramSync(payload: TelegramSyncRequest): Promise<EmailSyncResponse> {
  const endpoints = getTelegramSyncEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), TELEGRAM_SYNC_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      }).finally(() => {
        window.clearTimeout(timeout);
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error
            ? (data as { error?: string }).error
            : `HTTP ${response.status}`;
        throw new Error(String(errorMessage));
      }

      if (!isEmailSyncResponse(data)) {
        throw new Error('Telegram sync returned an invalid response');
      }

      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new Error('Telegram sync timed out. Try again in a moment.');
        continue;
      }
      lastError = error instanceof Error ? error : new Error('Unknown Telegram sync error');
    }
  }

  throw lastError ?? new Error('All Telegram sync endpoints failed');
}