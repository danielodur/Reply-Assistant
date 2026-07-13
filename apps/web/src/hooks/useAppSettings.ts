import { useCallback, useEffect, useState } from 'react';
import type { AppLanguage } from '../i18n/translations';

export type AppSettings = {
  autoCopy: boolean;
  compactMode: boolean;
  defaultLanguage: AppLanguage;
  focusMode: 'soft' | 'strong';
  /**
   * When true (default), Reply Assistant pre-drafts replies in the background
   * whenever a new inbound message arrives, and Daily Brief CTAs run end-to-end
   * Smart Reply on a single tap. Turn off to require manual Generate every time.
   */
  lazyMode: boolean;
  /**
   * When true (default), copying a generated reply to a VIP-client or Leader
   * triggers a brief "final check" confirmation showing the impression read-out.
   */
  highStakesGuard: boolean;
  /**
   * When true (default), Reply Assistant fires native desktop notifications on
   * new mail and ready drafts. Falls back to the in-app attention toast when
   * the platform denies permission or when this is off.
   */
  nativeNotifications: boolean;
  /**
   * Pauses native notifications during the configured window. The in-app
   * Daily Brief and badge keep updating; only the OS-level pings are muted.
   */
  quietHoursEnabled: boolean;
  /** 24-hour HH:MM. Used only when quietHoursEnabled is true. */
  quietHoursStart: string;
  /** 24-hour HH:MM. Wrap-around windows (start > end) cross midnight. */
  quietHoursEnd: string;
};

const SETTINGS_KEY = 'replyAssistantSettings';

const DEFAULT_SETTINGS: AppSettings = {
  autoCopy: false,
  compactMode: false,
  defaultLanguage: 'auto',
  focusMode: 'soft',
  lazyMode: true,
  highStakesGuard: true,
  nativeNotifications: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY) {
        setSettings(loadSettings());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggle = useCallback((key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const set = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return { settings, toggle, set };
}
