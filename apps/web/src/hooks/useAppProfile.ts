import { useCallback, useEffect, useState } from 'react';
import { PROFILE_SYNC_EVENT } from '../auth/authProfileBridge';
import {
  APP_PROFILE_STORAGE_KEY,
  getAppProfile,
  saveAppProfile,
  type AppProfile,
  type AppProfileKey,
} from '../config/appProfile';

const DISPLAY_NAME_MAX_LENGTH = 24;

function sanitizeDisplayName(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
  return normalized || fallback;
}

export function useAppProfile() {
  const [profile, setProfile] = useState<AppProfile>(getAppProfile);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === APP_PROFILE_STORAGE_KEY) {
        setProfile(getAppProfile());
      }
    };

    const handleProfileSync = () => {
      setProfile(getAppProfile());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROFILE_SYNC_EVENT, handleProfileSync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PROFILE_SYNC_EVENT, handleProfileSync);
    };
  }, []);

  const setField = useCallback((key: AppProfileKey, value: string) => {
    setProfile(prev => {
      const nextValue = key === 'displayName'
        ? sanitizeDisplayName(value, prev.displayName)
        : value;

      const next = {
        ...prev,
        [key]: nextValue,
      };
      saveAppProfile(next);
      return next;
    });
  }, []);

  return {
    profile,
    setField,
  };
}
