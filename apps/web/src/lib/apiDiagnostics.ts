/**
 * Lightweight client for the Reply Assistant API.
 *
 * Resolves the correct base URL automatically — works in both the Electron
 * desktop shell (where the API can run on port 4011 or 4000) and in the
 * standard web build (where the API is proxied via the same origin or on 4000).
 */

/** Shape of a single provider entry returned by /api/diagnostics/providers */
export type DiagnosticsProviderResult = {
  provider: string;
  configured: boolean;
  status: 'ok' | 'failed' | 'skipped';
  modelUsed?: string;
  latencyMs?: number;
  sampleOutput?: string;
  reason?: string;
};

/** Full payload returned by GET /api/diagnostics/providers */
export type DiagnosticsPayload = {
  preferredProvider: string;
  checkedAt: string;
  results: DiagnosticsProviderResult[];
};

/** Payload returned by GET /health */
export type HealthPayload = {
  status: 'ok';
  preferredProvider: string;
  configuredProviders: string[];
  supabaseLogging: boolean;
};

/** Fast provider availability — no live AI calls — from GET /api/status */
export type StatusPayload = {
  preferredProvider: string;
  configuredProviders: string[];
  supabaseLogging: boolean;
  checkedAt: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getApiEndpoints(path: string): string[] {
  const isElectron = Boolean(
    typeof window !== 'undefined' && (window as { desktopApp?: { isElectron?: boolean } }).desktopApp?.isElectron,
  );

  const candidates = isElectron
    ? [
        `http://localhost:4011${path}`,
        `http://localhost:4000${path}`,
        path,
      ]
    : [path, `http://localhost:4000${path}`];

  // deduplicate while preserving order
  return [...new Set(candidates)];
}

async function fetchWithFallback<T>(path: string, init?: RequestInit): Promise<T> {
  const endpoints = getApiEndpoints(path);
  let lastError: Error = new Error(`Failed to reach ${path}`);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, init);
      const data = (await response.json().catch(() => null)) as T | { error?: string } | null;

      if (!response.ok) {
        const message =
          data && typeof data === 'object' && 'error' in data && data.error
            ? String(data.error)
            : `HTTP ${response.status}`;
        throw new Error(message);
      }

      if (data === null) throw new Error('Empty response from server');

      return data as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Network error');
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /health — returns preferred provider and which providers are configured. */
export async function fetchHealth(): Promise<HealthPayload> {
  return fetchWithFallback<HealthPayload>('/health');
}

/**
 * GET /api/status — fast provider availability check with no live AI calls.
 * Falls back to /health when the /api/status endpoint is not yet available.
 */
export async function fetchApiStatus(): Promise<StatusPayload> {
  try {
    return await fetchWithFallback<StatusPayload>('/api/status');
  } catch {
    // Graceful degradation: /api/status may not exist on older API builds
    const health = await fetchHealth();
    return {
      preferredProvider: health.preferredProvider,
      configuredProviders: health.configuredProviders,
      supabaseLogging: health.supabaseLogging,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * GET /api/diagnostics/providers — runs a live test call against each provider
 * and returns latency, model used, and a sample output snippet.
 */
export async function fetchProviderDiagnostics(): Promise<DiagnosticsPayload> {
  return fetchWithFallback<DiagnosticsPayload>('/api/diagnostics/providers');
}
