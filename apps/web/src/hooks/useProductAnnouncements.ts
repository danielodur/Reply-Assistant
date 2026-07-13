import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductAnnouncements } from '../components/messages/productAnnouncementsApi';
import {
  clearProductAnnouncementsStorage,
  loadAnnouncementsCache,
  loadReadAnnouncementIds,
  saveAnnouncementsCache,
  saveReadAnnouncementIds,
  type ProductAnnouncement,
  PRODUCT_ANNOUNCEMENTS_CACHE_KEY,
  READ_PRODUCT_ANNOUNCEMENTS_KEY,
} from '../config/productAnnouncements';
import { domainIncludesDraftMemory, onDataReset } from '../config/resetAppData';

const CACHE_TTL_MS = 5 * 60 * 1000;

function pruneReadIds(readIds: string[], announcementIds: string[]): string[] {
  const valid = new Set(announcementIds);
  return readIds.filter(id => valid.has(id));
}

export function useProductAnnouncements(locale: string) {
  const normalizedLocale = locale.startsWith('zh') ? 'zh' : 'en';
  const [announcements, setAnnouncements] = useState<ProductAnnouncement[]>(() => {
    const cache = loadAnnouncementsCache();
    return cache?.locale === normalizedLocale ? cache.announcements : [];
  });
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => loadReadAnnouncementIds());
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (force = false) => {
    const cache = loadAnnouncementsCache();
    if (
      !force
      && cache
      && cache.locale === normalizedLocale
      && Date.now() - cache.fetchedAt < CACHE_TTL_MS
    ) {
      setAnnouncements(cache.announcements);
      setReadMessageIds(prev => {
        const next = pruneReadIds(prev, cache.announcements.map(item => item.id));
        if (next.length !== prev.length) {
          saveReadAnnouncementIds(next);
        }
        return next;
      });
      return;
    }

    setIsLoading(true);
    try {
      const nextAnnouncements = await fetchProductAnnouncements(normalizedLocale);
      saveAnnouncementsCache({
        locale: normalizedLocale,
        fetchedAt: Date.now(),
        announcements: nextAnnouncements,
      });
      setAnnouncements(nextAnnouncements);
      setReadMessageIds(prev => {
        const next = pruneReadIds(prev, nextAnnouncements.map(item => item.id));
        if (next.length !== prev.length) {
          saveReadAnnouncementIds(next);
        }
        return next;
      });
    } catch {
      const fallback = loadAnnouncementsCache();
      if (fallback?.locale === normalizedLocale) {
        setAnnouncements(fallback.announcements);
      } else {
        setAnnouncements([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [normalizedLocale]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRODUCT_ANNOUNCEMENTS_CACHE_KEY) {
        const cache = loadAnnouncementsCache();
        if (cache?.locale === normalizedLocale) {
          setAnnouncements(cache.announcements);
        }
      }
      if (event.key === READ_PRODUCT_ANNOUNCEMENTS_KEY) {
        setReadMessageIds(loadReadAnnouncementIds());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [normalizedLocale]);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesDraftMemory(domains)) {
        clearProductAnnouncementsStorage();
        setAnnouncements([]);
        setReadMessageIds([]);
      }
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setReadMessageIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveReadAnnouncementIds(next);
      return next;
    });
  }, []);

  const unreadMessageCount = useMemo(
    () => announcements.filter(item => !readMessageIds.includes(item.id)).length,
    [announcements, readMessageIds],
  );

  return {
    announcements,
    readMessageIds,
    unreadMessageCount,
    markRead,
    refresh,
    isLoading,
  };
}
