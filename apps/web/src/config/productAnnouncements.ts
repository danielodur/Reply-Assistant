export type ProductAnnouncement = {
  id: string;
  title: string;
  body: string;
  publishedAt: number;
};

export type ProductAnnouncementsCache = {
  locale: string;
  fetchedAt: number;
  announcements: ProductAnnouncement[];
};

export const PRODUCT_ANNOUNCEMENTS_CACHE_KEY = 'replyAssistantProductAnnouncementsCache';
export const READ_PRODUCT_ANNOUNCEMENTS_KEY = 'replyAssistantReadMessages';

export function loadReadAnnouncementIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_PRODUCT_ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReadAnnouncementIds(ids: string[]): void {
  localStorage.setItem(READ_PRODUCT_ANNOUNCEMENTS_KEY, JSON.stringify(ids));
}

export function loadAnnouncementsCache(): ProductAnnouncementsCache | null {
  try {
    const raw = localStorage.getItem(PRODUCT_ANNOUNCEMENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProductAnnouncementsCache>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.locale !== 'string' || typeof parsed.fetchedAt !== 'number') return null;
    if (!Array.isArray(parsed.announcements)) return null;
    const announcements = parsed.announcements
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const row = item as Partial<ProductAnnouncement>;
        if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.body !== 'string') {
          return null;
        }
        return {
          id: row.id,
          title: row.title,
          body: row.body,
          publishedAt: typeof row.publishedAt === 'number' ? row.publishedAt : Date.now(),
        } satisfies ProductAnnouncement;
      })
      .filter((item): item is ProductAnnouncement => item !== null);
    return {
      locale: parsed.locale,
      fetchedAt: parsed.fetchedAt,
      announcements,
    };
  } catch {
    return null;
  }
}

export function saveAnnouncementsCache(cache: ProductAnnouncementsCache): void {
  localStorage.setItem(PRODUCT_ANNOUNCEMENTS_CACHE_KEY, JSON.stringify(cache));
}

export function clearProductAnnouncementsStorage(): void {
  localStorage.removeItem(PRODUCT_ANNOUNCEMENTS_CACHE_KEY);
  localStorage.removeItem(READ_PRODUCT_ANNOUNCEMENTS_KEY);
}
