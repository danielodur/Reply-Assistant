/**
 * useEmailAutoSync
 *
 * Background email poller. Every POLL_INTERVAL ms it reads the saved IMAP
 * credentials from localStorage, fetches the last 2 days of mail from all
 * contacts that have an email address, deduplicates against a persistent
 * "already surfaced" set, and fires onNewMessages when genuinely new
 * contact emails arrive.
 *
 * - Never runs if no credentials are saved.
 * - Never runs two syncs simultaneously.
 * - Automatically stops when the component unmounts.
 */

import { useCallback, useEffect, useRef } from 'react';
import { loadSyncDraft } from '../components/contacts/syncFormStorage';
import { requestEmailSync } from '../components/contacts/emailSyncApi';
import { IMAP_PRESETS, type ImapPresetId } from '../components/contacts/imapPresets';
import type { ContactThread } from '../config/contactThreads';
import type { EmailSyncUpdate } from '../components/contacts/emailSyncTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const QUICK_FIRST_POLL_MS = 30 * 1000;  // first poll 30 s after mount
const SEEN_IDS_KEY = 'replyAssistantAutoSync_seenIds';
const EMAIL_CONNECTION_KEY = 'replyAssistantConnectedEmail';
const MAX_SEEN_IDS = 2000; // cap set size to avoid unbounded growth

// ---------------------------------------------------------------------------
// Seen-IDs persistence helpers
// ---------------------------------------------------------------------------
function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  try {
    // Keep only the newest MAX_SEEN_IDS entries (array order is insertion order)
    const arr = [...ids].slice(-MAX_SEEN_IDS);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(arr));
  } catch {
    // localStorage quota — ignore silently
  }
}

// ---------------------------------------------------------------------------
// Saved credentials helper
// ---------------------------------------------------------------------------
type SavedDraft = {
  imapPresetId: ImapPresetId;
  username: string;
  password: string;
};

function loadSavedCredentials(): SavedDraft | null {
  const draft = loadSyncDraft<SavedDraft>(EMAIL_CONNECTION_KEY, {
    imapPresetId: 'qq',
    username: '',
    password: '',
  });
  if (!draft.username.trim() || !draft.password.trim()) return null;
  return draft;
}

// ---------------------------------------------------------------------------
// Hook types
// ---------------------------------------------------------------------------
export type NewEmailNotice = {
  contactId: string;
  contactName: string;
  newCount: number;
  /** Plain text of the most recent newly-arrived inbound — used for background pre-drafting */
  latestInboundText?: string;
};

type UseEmailAutoSyncOptions = {
  contacts: ContactThread[];
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
  onNewMessages: (notices: NewEmailNotice[]) => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useEmailAutoSync({
  contacts,
  onApplyUpdates,
  onNewMessages,
}: UseEmailAutoSyncOptions): void {
  const runningRef = useRef(false);
  // Keep latest props accessible inside the interval callback without
  // recreating the interval on every render.
  const contactsRef = useRef(contacts);
  const onApplyRef = useRef(onApplyUpdates);
  const onNewRef = useRef(onNewMessages);

  useEffect(() => { contactsRef.current = contacts; }, [contacts]);
  useEffect(() => { onApplyRef.current = onApplyUpdates; }, [onApplyUpdates]);
  useEffect(() => { onNewRef.current = onNewMessages; }, [onNewMessages]);

  const runSync = useCallback(async () => {
    if (runningRef.current) return; // skip if already in flight
    const creds = loadSavedCredentials();
    if (!creds) return; // no credentials saved — nothing to do

    const contactsSnapshot = contactsRef.current;
    const emailContacts = contactsSnapshot.filter(c => Boolean(c.email?.trim()));
    if (!emailContacts.length) return;

    runningRef.current = true;

    try {
      const preset = IMAP_PRESETS.find(p => p.id === creds.imapPresetId) ?? IMAP_PRESETS[0];
      const result = await requestEmailSync({
        syncConfig: {
          provider: 'imap',
          host: preset.host,
          port: preset.port,
          secure: preset.secure,
          username: creds.username,
          password: creds.password,
          mailbox: 'INBOX',
          sinceDays: 2,      // background polls only need the last 2 days
          maxMessages: 50,   // conservative — don't hammer the server
        },
        contacts: contactsSnapshot,
      });

      if (!result.updates.length) return;

      // Apply the updates to contact threads first
      onApplyRef.current(result.updates);

      // Detect genuinely new messages the user hasn't been notified about yet
      const seenIds = loadSeenIds();
      const notices: NewEmailNotice[] = [];

      for (const update of result.updates) {
        if (!update.syncedMessages?.length) continue;

        const contact = contactsSnapshot.find(c => c.id === update.contactId);
        if (!contact) continue;

        // Only inbound (received) emails count as "new mail" notifications
        const inbound = update.syncedMessages.filter(m => m.direction === 'inbound');
        const newInbound = inbound.filter(m => {
          const key = m.externalId
            ? `${update.contactId}:${m.externalId}`
            : `${update.contactId}:${m.sentAt}:${m.text.slice(0, 40)}`;
          return !seenIds.has(key);
        });

        if (!newInbound.length) continue;

        // Mark them as seen
        for (const m of newInbound) {
          const key = m.externalId
            ? `${update.contactId}:${m.externalId}`
            : `${update.contactId}:${m.sentAt}:${m.text.slice(0, 40)}`;
          seenIds.add(key);
        }

        const latestNewInbound = [...newInbound]
          .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))[0];
        notices.push({
          contactId: update.contactId,
          contactName: contact.name,
          newCount: newInbound.length,
          latestInboundText: latestNewInbound?.text?.trim() || undefined,
        });
      }

      saveSeenIds(seenIds);

      if (notices.length) {
        onNewRef.current(notices);
      }
    } catch {
      // Background sync failures are silent — the user didn't ask for this
      // particular sync and shouldn't see a disruptive error.
    } finally {
      runningRef.current = false;
    }
  }, []);

  const contactsSignature = contacts
    .filter(c => Boolean(c.email?.trim()))
    .map(c => `${c.id}:${c.email?.trim()?.toLowerCase() ?? ''}`)
    .sort()
    .join('|');

  useEffect(() => {
    if (!contactsSignature) return;

    // When contacts are newly added/updated, run a near-immediate poll so users
    // don't wait up to 5 minutes to see synced inbound mail.
    const timer = window.setTimeout(() => {
      void runSync();
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [contactsSignature, runSync]);

  useEffect(() => {
    // First poll: 30 s after mount (gives the app time to fully load)
    const firstTimer = window.setTimeout(() => {
      void runSync();
    }, QUICK_FIRST_POLL_MS);

    // Recurring poll every 5 minutes
    const interval = window.setInterval(() => {
      void runSync();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
    };
  }, [runSync]);
}
