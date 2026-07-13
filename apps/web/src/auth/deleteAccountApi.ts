import { getAccessToken } from './authSessionBridge';

function getDeleteAccountEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? ['http://localhost:4011/api/account/delete', 'http://localhost:4000/api/account/delete', '/api/account/delete']
    : ['/api/account/delete', 'http://localhost:4000/api/account/delete'];

  return [...new Set(endpointCandidates)];
}

export async function requestAccountDeletion(): Promise<void> {
  const endpoints = getDeleteAccountEndpoints();
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
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error
            ? (data as { error?: string }).error
            : `HTTP ${response.status}`;
        throw new Error(String(errorMessage));
      }

      if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: boolean }).ok) {
        throw new Error('Unexpected response');
      }

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  throw lastError ?? new Error('All API endpoints failed');
}
