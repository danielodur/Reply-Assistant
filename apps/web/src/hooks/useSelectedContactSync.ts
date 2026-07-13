import { useCallback, useEffect, useState } from 'react';
import {
  readSelectedContactId,
  subscribeSelectedContactId,
  writeSelectedContactId,
} from '../config/selectedContactPersistence';

export function useSelectedContactSync(): [string | null, (contactId: string | null) => void] {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => readSelectedContactId());

  useEffect(() => subscribeSelectedContactId(setSelectedContactId), []);

  const persistSelectedContactId = useCallback((contactId: string | null) => {
    writeSelectedContactId(contactId);
    setSelectedContactId(contactId);
  }, []);

  return [selectedContactId, persistSelectedContactId];
}
