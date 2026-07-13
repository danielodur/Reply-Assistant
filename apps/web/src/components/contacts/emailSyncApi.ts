import { type EmailSyncRequest, type EmailSyncResponse, isEmailSyncResponse } from './emailSyncTypes';

const EMAIL_SYNC_REQUEST_TIMEOUT_MS = 20000;

function getEmailSyncEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? ['http://localhost:4011/api/email/sync', 'http://localhost:4000/api/email/sync', '/api/email/sync']
    : ['/api/email/sync', 'http://localhost:4000/api/email/sync'];

  return [...new Set(endpointCandidates)];
}

export async function requestEmailSync(payload: EmailSyncRequest): Promise<EmailSyncResponse> {
  const endpoints = getEmailSyncEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), EMAIL_SYNC_REQUEST_TIMEOUT_MS);

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
        throw new Error('Email sync returned an invalid response');
      }

      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new Error('Email sync timed out. Try again or use fewer recent messages.');
        continue;
      }

      lastError = error instanceof Error ? error : new Error('Unknown email sync error');
    }
  }

  throw lastError ?? new Error('All email sync endpoints failed');
}
