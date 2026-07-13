/**
 * Single source of truth for the contact selected in FloatingAssistant (picker + threads).
 * Pair updates with work mode alignment (requiredWorkModeForContact) in the shell.
 */
export const REPLY_ASSISTANT_SELECTED_CONTACT_ID_KEY = 'replyAssistantSelectedContactId' as const;

export const SELECTED_CONTACT_CHANGED_EVENT = 'replyAssistantSelectedContactChanged';

export function readSelectedContactId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(REPLY_ASSISTANT_SELECTED_CONTACT_ID_KEY);
}

export function writeSelectedContactId(contactId: string | null): void {
  if (typeof localStorage === 'undefined') return;

  if (contactId) {
    localStorage.setItem(REPLY_ASSISTANT_SELECTED_CONTACT_ID_KEY, contactId);
  } else {
    localStorage.removeItem(REPLY_ASSISTANT_SELECTED_CONTACT_ID_KEY);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SELECTED_CONTACT_CHANGED_EVENT, {
      detail: { contactId },
    }));
  }
}

export function subscribeSelectedContactId(
  listener: (contactId: string | null) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== REPLY_ASSISTANT_SELECTED_CONTACT_ID_KEY) return;
    listener(event.newValue);
  };

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ contactId: string | null }>).detail;
    listener(detail?.contactId ?? null);
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(SELECTED_CONTACT_CHANGED_EVENT, onCustom);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(SELECTED_CONTACT_CHANGED_EVENT, onCustom);
  };
}
