import { getAccessToken } from '../../auth/authSessionBridge';
import type { SupportIssueId } from './supportIssueCategories';

export type SupportRequestPayload = {
  displayName: string;
  email: string;
  phoneNumber?: string;
  issueCategory: SupportIssueId;
  message: string;
  appVersion?: string;
  platform?: string;
};

function getSupportRequestEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? [
        'http://localhost:4011/api/support/request',
        'http://localhost:4000/api/support/request',
        '/api/support/request',
      ]
    : ['/api/support/request', 'http://localhost:4000/api/support/request'];

  return [...new Set(endpointCandidates)];
}

export async function submitSupportRequest(payload: SupportRequestPayload): Promise<string> {
  const endpoints = getSupportRequestEndpoints();
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Not signed in');
  }

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error
            ? (data as { error?: string }).error
            : `HTTP ${response.status}`;
        throw new Error(String(errorMessage));
      }

      if (
        !data
        || typeof data !== 'object'
        || !('ok' in data)
        || !(data as { ok?: boolean }).ok
        || !('id' in data)
        || typeof (data as { id?: unknown }).id !== 'string'
      ) {
        throw new Error('Unexpected response');
      }

      return (data as { id: string }).id;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  throw lastError ?? new Error('All API endpoints failed');
}
