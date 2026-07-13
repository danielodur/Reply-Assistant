import type { ContactThreadContext } from '../../config/contactThreads';
import type { StructuredRequest } from './requestModel';
import { type GenerateApiResponse, isGenerateApiResponse } from './generatedReplyTypes';
import { getAccessToken } from '../../auth/authSessionBridge';

export type GenerateApiRequest = StructuredRequest & {
  contactThread?: ContactThreadContext | null;
  preferredProvider?: string;
};

function getGenerateEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? ['http://localhost:4011/api/generate', 'http://localhost:4000/api/generate', '/api/generate']
    : ['/api/generate', 'http://localhost:4000/api/generate'];

  return [...new Set(endpointCandidates)];
}

export async function requestGeneratedOutput(payload: GenerateApiRequest): Promise<GenerateApiResponse> {
  const endpoints = getGenerateEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const accessToken = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
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

      if (!isGenerateApiResponse(data)) {
        throw new Error('API returned an empty output');
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  throw lastError ?? new Error('All API endpoints failed');
}