import { getAccessToken } from '../../auth/authSessionBridge';
import type { ProductAnnouncement } from '../../config/productAnnouncements';

function getProductAnnouncementsEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? [
        'http://localhost:4011/api/product-announcements',
        'http://localhost:4000/api/product-announcements',
        '/api/product-announcements',
      ]
    : ['/api/product-announcements', 'http://localhost:4000/api/product-announcements'];

  return [...new Set(endpointCandidates)];
}

function normalizeAnnouncement(value: unknown): ProductAnnouncement | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as {
    id?: unknown;
    title?: unknown;
    body?: unknown;
    publishedAt?: unknown;
    published_at?: unknown;
  };
  if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.body !== 'string') {
    return null;
  }

  let publishedAt = Date.now();
  if (typeof row.publishedAt === 'number' && Number.isFinite(row.publishedAt)) {
    publishedAt = row.publishedAt;
  } else if (typeof row.published_at === 'string') {
    const parsed = Date.parse(row.published_at);
    if (Number.isFinite(parsed)) publishedAt = parsed;
  }

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt,
  };
}

export async function fetchProductAnnouncements(locale: string): Promise<ProductAnnouncement[]> {
  const endpoints = getProductAnnouncementsEndpoints();
  const accessToken = getAccessToken();
  const query = new URLSearchParams({ locale });
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}?${query.toString()}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
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
        || !('announcements' in data)
        || !Array.isArray((data as { announcements?: unknown }).announcements)
      ) {
        throw new Error('Unexpected response');
      }

      return (data as { announcements: unknown[] }).announcements
        .map(normalizeAnnouncement)
        .filter((item): item is ProductAnnouncement => item !== null);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  throw lastError ?? new Error('All API endpoints failed');
}
