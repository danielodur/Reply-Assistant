type OAuthUrlRequest = {
  provider: 'gmail-oauth' | 'microsoft-oauth';
  clientId: string;
  redirectUri: string;
  tenantId?: string;
  state?: string;
  codeChallenge?: string;
};

type OAuthUrlResponse = {
  ok: boolean;
  authUrl?: string;
  error?: string;
};

type OAuthTokenRequest = {
  provider: 'gmail-oauth' | 'microsoft-oauth';
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  tenantId?: string;
  codeVerifier?: string;
};

type OAuthTokenResponse = {
  ok: boolean;
  token?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scope?: string;
  };
  error?: string;
};

function getOAuthEndpoints(path: string): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? [`http://localhost:4011${path}`, `http://localhost:4000${path}`, path]
    : [path, `http://localhost:4000${path}`];

  return [...new Set(endpointCandidates)];
}

async function postWithFallback<T>(path: string, payload: unknown): Promise<T> {
  const endpoints = getOAuthEndpoints(path);
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as T | { error?: string } | null;

      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && data.error
          ? data.error
          : `HTTP ${response.status}`;
        throw new Error(String(message));
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid OAuth API response');
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OAuth API error');
    }
  }

  throw lastError ?? new Error('All OAuth endpoints failed');
}

export async function requestEmailOAuthUrl(payload: OAuthUrlRequest): Promise<OAuthUrlResponse> {
  return postWithFallback<OAuthUrlResponse>('/api/email/oauth/url', payload);
}

export async function requestEmailOAuthToken(payload: OAuthTokenRequest): Promise<OAuthTokenResponse> {
  return postWithFallback<OAuthTokenResponse>('/api/email/oauth/token', payload);
}
