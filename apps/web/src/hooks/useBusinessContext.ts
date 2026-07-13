import { useEffect, useState } from 'react';
import {
  BUSINESS_CONTEXT_STORAGE_KEY,
  loadBusinessContext,
  saveBusinessContext,
  type BusinessContext,
  type BusinessContextKey,
} from '../config/businessContext';
import { domainIncludesWorkContext, onDataReset } from '../config/resetAppData';

export function useBusinessContext() {
  const [context, setContext] = useState<BusinessContext>(loadBusinessContext);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BUSINESS_CONTEXT_STORAGE_KEY) {
        setContext(loadBusinessContext());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesWorkContext(domains)) {
        setContext(loadBusinessContext());
      }
    });
  }, []);

  const setField = (key: BusinessContextKey, value: string) => {
    setContext(prev => {
      const next = { ...prev, [key]: value };
      saveBusinessContext(next);
      return next;
    });
  };

  return { context, setField };
}
