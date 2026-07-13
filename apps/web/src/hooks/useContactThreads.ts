import { useCallback, useEffect, useState } from 'react';
import {
  buildContactMessageEntry,
  buildContactThread,
  CONTACT_THREADS_STORAGE_KEY,
  appendReplyLearningSignal,
  dismissContactCommitment,
  loadContactThreads,
  mergeThreadChatContext,
  patchLatestGeneratedOutbound,
  refreshContactContinuity,
  saveContactThreads,
  updateContactThreadSummary,
  type ContactMemoryProfile,
  type ContactMessageEntry,
  type ContactReplyEntry,
  type ContactStage,
  type ContactThread,
  type ContactReplyLearningSignal,
  type PendingDraft,
} from '../config/contactThreads';
import { mergeSyncedMessages } from '../config/contactSync';
import type { EmailSyncUpdate } from '../components/contacts/emailSyncTypes';
import { domainIncludesContacts, onDataReset } from '../config/resetAppData';

type CreateContactInput = {
  name: string;
  company?: string;
  email?: string;
  stage?: ContactStage;
  notes?: string;
  memoryProfile?: ContactMemoryProfile;
};

export function useContactThreads() {
  const [threads, setThreads] = useState<ContactThread[]>(loadContactThreads);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONTACT_THREADS_STORAGE_KEY) {
        setThreads(loadContactThreads());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesContacts(domains)) {
        setThreads(loadContactThreads());
      }
    });
  }, []);

  const setAndSave = useCallback((updater: (prev: ContactThread[]) => ContactThread[]) => {
    setThreads(prev => {
      const next = updater(prev);
      saveContactThreads(next);
      return next;
    });
  }, []);

  const createContact = useCallback((input: CreateContactInput) => {
    const nextThread = buildContactThread(input);
    setAndSave(prev => [nextThread, ...prev]);
    return nextThread;
  }, [setAndSave]);

  const addReplyToContact = useCallback((contactId: string, reply: ContactReplyEntry) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      const outboundMessage = buildContactMessageEntry({
        direction: 'outbound',
        source: 'generated-reply',
        text: reply.preview,
        sender: 'You',
        receiver: thread.name,
        createdAt: reply.createdAt,
      });
      const nextMessages = [outboundMessage, ...thread.messages].slice(0, 30);
      return refreshContactContinuity({
        ...thread,
        replies: [reply, ...thread.replies].slice(0, 20),
        messages: nextMessages,
        lastReplyAt: reply.createdAt,
        updatedAt: reply.createdAt,
        chatContext: mergeThreadChatContext(nextMessages, thread.chatContext),
      });
    }));
  }, [setAndSave]);

  const removeContact = useCallback((contactId: string) => {
    setAndSave(prev => prev.filter(thread => thread.id !== contactId));
  }, [setAndSave]);

  const updateChatContext = useCallback((contactId: string, chatContext: string) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return {
        ...thread,
        chatContext: mergeThreadChatContext(thread.messages, chatContext),
        updatedAt: Date.now(),
      };
    }));
  }, [setAndSave]);

  const addMessageToContact = useCallback((
    contactId: string,
    messageOrFactory: ContactMessageEntry | ((thread: ContactThread) => ContactMessageEntry),
  ) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      const message = typeof messageOrFactory === 'function' ? messageOrFactory(thread) : messageOrFactory;
      const nextMessages = [message, ...thread.messages].slice(0, 30);
      return refreshContactContinuity({
        ...thread,
        messages: nextMessages,
        updatedAt: message.createdAt,
        chatContext: mergeThreadChatContext(nextMessages, thread.chatContext),
      });
    }));
  }, [setAndSave]);

  const applyChatContextUpdates = useCallback((updates: EmailSyncUpdate[]) => {
    if (!updates.length) return;

    const byId = new Map(updates.map(item => [item.contactId, item]));
    const now = Date.now();

    setAndSave(prev => prev.map(thread => {
      const next = byId.get(thread.id);
      if (!next) return thread;

      const mergedMessages = mergeSyncedMessages(thread.messages, next.syncedMessages ?? []);
      return refreshContactContinuity({
        ...thread,
        messages: mergedMessages,
        chatContext: mergeThreadChatContext(mergedMessages, next.chatContext),
        updatedAt: now,
      });
    }));
  }, [setAndSave]);

  const updateContactMemory = useCallback((contactId: string, memoryProfile: ContactMemoryProfile) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return {
        ...thread,
        memoryProfile: {
          ...thread.memoryProfile,
          ...memoryProfile,
        },
        updatedAt: Date.now(),
      };
    }));
  }, [setAndSave]);

  const syncLatestGeneratedReply = useCallback((contactId: string, finalPreview: string) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return refreshContactContinuity(patchLatestGeneratedOutbound(thread, finalPreview));
    }));
  }, [setAndSave]);

  const recordReplyLearning = useCallback((
    contactId: string,
    signal: Omit<ContactReplyLearningSignal, 'id' | 'createdAt'> & { createdAt?: number },
  ) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return appendReplyLearningSignal(thread, signal);
    }));
  }, [setAndSave]);

  const dismissCommitment = useCallback((contactId: string, sourceMessageId: string) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return dismissContactCommitment(thread, sourceMessageId);
    }));
  }, [setAndSave]);

  const updateThreadSummary = useCallback((contactId: string, text: string) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      return updateContactThreadSummary(thread, text);
    }));
  }, [setAndSave]);

  const setPendingDraft = useCallback((contactId: string, draft: PendingDraft | null) => {
    setAndSave(prev => prev.map(thread => {
      if (thread.id !== contactId) return thread;
      if (draft == null) {
        if (!thread.pendingDraft) return thread;
        const { pendingDraft: _drop, ...rest } = thread;
        return rest;
      }
      return { ...thread, pendingDraft: draft };
    }));
  }, [setAndSave]);

  return {
    threads,
    createContact,
    addReplyToContact,
    addMessageToContact,
    removeContact,
    updateChatContext,
    applyChatContextUpdates,
    updateContactMemory,
    syncLatestGeneratedReply,
    recordReplyLearning,
    dismissCommitment,
    updateThreadSummary,
    setPendingDraft,
  };
}
