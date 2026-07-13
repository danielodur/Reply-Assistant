import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getTranslations, type AppLanguage } from '../i18n/translations';
import { useAppProfile } from '../hooks/useAppProfile';
import { useAppSettings } from '../hooks/useAppSettings';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useContactThreads } from '../hooks/useContactThreads';
import { useActionInbox } from '../hooks/useActionInbox';
import { useTodayQueue } from '../hooks/useTodayQueue';
import { buildContactMessageEntry, type ContactMemoryProfile, type ContactStage } from '../config/contactThreads';
import { useSelectedContactSync } from '../hooks/useSelectedContactSync';
import type { MiniScreenId } from './workbench/types';
import type { TodayQueueAction } from './TodayQueue';
import type { ActionInboxItem } from './action-inbox/types';
import TodayQueue, { buildTodayQueueTasks } from './TodayQueue';
import ActionInbox from './ActionInbox';
import ContactThreads from './ContactThreads';
import Settings from './Settings';
import CustomerService from './customer-service';
import ReferFriends from './refer-friends';
import Messages from './Messages';
import RecentReplies from './RecentReplies';
import SnippetLibrary from './SnippetLibrary';
import ResetData from './ResetData';
import BusinessContextScreen from './BusinessContext';
import WeeklyRecap from './WeeklyRecap';
import { buildContactFollowUpTasks } from './contacts/followUpTasks';
import { isAppFoundationEmpty } from '../lib/isAppFoundationEmpty';
import { useProductAnnouncements } from '../hooks/useProductAnnouncements';

const RECENT_REPLIES_KEY = 'replyAssistantRecentReplies';
const SNIPPETS_KEY = 'replyAssistantSnippets';

type ChildAction =
  | { type: 'open-screen'; screenId: MiniScreenId }
  | { type: 'select-contact'; contactId: string | null }
  | { type: 'compose-from-contact'; contactId: string; text: string }
  | { type: 'use-recent-reply'; value: string }
  | { type: 'use-snippet'; value: string }
  | { type: 'run-today-task'; action: TodayQueueAction }
  | { type: 'run-action-inbox-item'; item: ActionInboxItem }
  | { type: 'smart-reply-contact'; contactId: string };

function isMiniScreenId(value: string | null): value is MiniScreenId {
  return Boolean(value) && [
    'today-queue',
    'action-inbox',
    'contact-threads',
    'settings',
    'customer-service',
    'refer-friends',
    'messages',
    'recent-replies',
    'snippet-library',
    'reset-data',
    'business-context',
    'weekly-recap',
  ].includes(value);
}

function loadJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function sendChildAction(action: ChildAction) {
  if (window.desktopApp?.sendChildAction) {
    void window.desktopApp.sendChildAction(action);
  }
}

export default function DetachedMiniScreenHost() {
  const params = new URLSearchParams(window.location.search);
  const screenId = isMiniScreenId(params.get('childScreen')) ? params.get('childScreen') as MiniScreenId : 'messages';
  const { loading, session } = useAuth();
  const { settings, toggle: toggleSetting, set: setSetting } = useAppSettings();
  const { profile, setField: setProfileField } = useAppProfile();
  const { context: businessContext, setField: setBusinessContextField } = useBusinessContext();
  const {
    threads,
    createContact,
    addMessageToContact,
    removeContact,
    updateChatContext,
    applyChatContextUpdates,
    updateContactMemory,
  } = useContactThreads();
  const actionInbox = useActionInbox();
  const todayQueue = useTodayQueue();
  const copy = useMemo(() => getTranslations(settings.defaultLanguage as AppLanguage), [settings.defaultLanguage]);
  const {
    announcements: productAnnouncements,
    readMessageIds,
    unreadMessageCount,
    markRead: handleMarkMessageRead,
    isLoading: productAnnouncementsLoading,
    refresh: refreshProductAnnouncements,
  } = useProductAnnouncements(settings.defaultLanguage);
  const [recentReplies, setRecentReplies] = useState<Array<{
      id: string;
      preview: string;
      variant: 'balanced';
      mode: 'reply' | 'internal';
      recipient: string;
      createdAt: number;
    }>>(() => loadJsonArray<{
      id: string;
      preview: string;
      variant: 'balanced';
      mode: 'reply' | 'internal';
      recipient: string;
      createdAt: number;
    }>(RECENT_REPLIES_KEY).slice(0, 12));
  const [snippetStoredCount, setSnippetStoredCount] = useState(() => loadJsonArray<{ id: string }>(SNIPPETS_KEY).length);
  const snippetCount = snippetStoredCount || copy.snippetLibrary.defaultSnippets.length;
  const contactFollowUpTasks = useMemo(
    () => buildContactFollowUpTasks(threads, copy),
    [threads, copy],
  );
  const [selectedContactId, persistSelectedContactId] = useSelectedContactSync();

  const handleSelectContact = (contactId: string | null) => {
    persistSelectedContactId(contactId);
    sendChildAction({ type: 'select-contact', contactId });
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENT_REPLIES_KEY) {
        setRecentReplies(loadJsonArray<{
          id: string;
          preview: string;
          variant: 'balanced';
          mode: 'reply' | 'internal';
          recipient: string;
          createdAt: number;
        }>(RECENT_REPLIES_KEY).slice(0, 12));
      }
      if (event.key === SNIPPETS_KEY) {
        setSnippetStoredCount(loadJsonArray<{ id: string }>(SNIPPETS_KEY).length);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const onClose = () => {
    if (window.desktopApp?.closeChildScreen) {
      void window.desktopApp.closeChildScreen(screenId);
      return;
    }
    window.close();
  };

  useEffect(() => {
    if (screenId === 'messages') {
      void refreshProductAnnouncements(true);
    }
  }, [screenId, refreshProductAnnouncements]);

  useEffect(() => {
    if (!loading && !session) {
      onClose();
    }
  }, [loading, session, screenId]);

  const handleOpenScreen = (nextScreenId: MiniScreenId) => {
    if (window.desktopApp?.openChildScreen) {
      void window.desktopApp.openChildScreen(nextScreenId);
      return;
    }
    sendChildAction({ type: 'open-screen', screenId: nextScreenId });
  };

  const handleTodayQueueAction = (action: TodayQueueAction) => {
    if (action.kind === 'open-screen') {
      handleOpenScreen(action.screenId);
      return;
    }
    sendChildAction({ type: 'run-today-task', action });
  };

  const handleActionInboxDoNow = (item: ActionInboxItem) => {
    actionInbox.markDone(item.id);
    sendChildAction({ type: 'run-action-inbox-item', item });
  };

  const foundationEmpty = isAppFoundationEmpty(threads);

  const renderScreen = () => {
    switch (screenId) {
      case 'today-queue':
        return (
          <TodayQueue
            onClose={onClose}
            copy={copy}
            unreadMessageCount={unreadMessageCount}
            snippetCount={snippetCount}
            recentRepliesCount={recentReplies.length}
            context={businessContext}
            extraTasks={contactFollowUpTasks}
            onRunTask={handleTodayQueueAction}
            isDone={todayQueue.isDone}
            analytics={todayQueue.analytics}
            markDone={todayQueue.markDone}
            markUsedNow={todayQueue.markUsedNow}
          />
        );
      case 'action-inbox':
        return (
          <ActionInbox
            onClose={onClose}
            copy={copy}
            items={actionInbox.pendingItems}
            analytics={actionInbox.analytics}
            completionRate={actionInbox.completionRate}
            onDoNow={handleActionInboxDoNow}
            onRemove={actionInbox.removePending}
            foundationEmpty={foundationEmpty}
            onOpenScreen={handleOpenScreen}
          />
        );
      case 'contact-threads':
        return (
          <ContactThreads
            onClose={onClose}
            copy={copy}
            threads={threads}
            selectedContactId={selectedContactId}
            onSelectContact={handleSelectContact}
            onCreateContact={input => {
              const nextThread = createContact(input as { name: string; company?: string; email?: string; stage?: ContactStage; notes?: string; memoryProfile?: ContactMemoryProfile });
              handleSelectContact(nextThread.id);
              return nextThread;
            }}
            onRemoveContact={removeContact}
            onAddMessage={(contactId, text) => {
              const thread = threads.find(item => item.id === contactId);
              addMessageToContact(contactId, buildContactMessageEntry({
                direction: 'inbound',
                source: 'paste',
                text,
                sender: thread?.name || 'Contact',
                receiver: profile.displayName || 'You',
              }));
            }}
            onUpdateChatContext={updateChatContext}
            onSaveMemory={updateContactMemory}
            onSaveAndCompose={(contactId, text) => {
              handleSelectContact(contactId);
              sendChildAction({ type: 'compose-from-contact', contactId, text });
            }}
            onSmartReply={contact => {
              sendChildAction({ type: 'smart-reply-contact', contactId: contact.id });
            }}
          />
        );
      case 'settings':
        return (
          <Settings
            onClose={onClose}
            settings={settings}
            profile={profile}
            onToggle={toggleSetting}
            onSet={setSetting}
            onSetProfile={setProfileField}
            copy={copy}
            contacts={threads}
            preferredTargetContactId={selectedContactId}
            onApplyChatContextUpdates={applyChatContextUpdates}
          />
        );
      case 'customer-service':
        return <CustomerService onClose={onClose} copy={copy} />;
      case 'refer-friends':
        return <ReferFriends onClose={onClose} profile={profile} copy={copy} compact />;
      case 'messages':
        return (
          <Messages
            onClose={onClose}
            copy={copy}
            announcements={productAnnouncements}
            readMessageIds={readMessageIds}
            onMarkRead={handleMarkMessageRead}
            isLoading={productAnnouncementsLoading}
          />
        );
      case 'recent-replies':
        return (
          <RecentReplies
            onClose={onClose}
            replies={recentReplies}
            copy={copy}
            foundationEmpty={foundationEmpty}
            onOpenScreen={handleOpenScreen}
            onUse={value => sendChildAction({ type: 'use-recent-reply', value })}
          />
        );
      case 'snippet-library':
        return (
          <SnippetLibrary
            onClose={onClose}
            copy={copy}
            onUse={value => sendChildAction({ type: 'use-snippet', value })}
          />
        );
      case 'reset-data':
        return (
          <ResetData
            onClose={onClose}
            copy={copy}
            foundationEmpty={foundationEmpty}
            onOpenScreen={handleOpenScreen}
          />
        );
      case 'business-context':
        return (
          <BusinessContextScreen
            onClose={onClose}
            context={businessContext}
            onSetField={setBusinessContextField}
            copy={copy}
          />
        );
      case 'weekly-recap':
        return (
          <WeeklyRecap
            onClose={onClose}
            copy={copy}
            recentRepliesRecipients={recentReplies.map(reply => reply.recipient)}
            contacts={threads}
            foundationEmpty={foundationEmpty}
            onOpenScreen={handleOpenScreen}
          />
        );
      default:
        return (
          <Messages
            onClose={onClose}
            copy={copy}
            announcements={productAnnouncements}
            readMessageIds={readMessageIds}
            onMarkRead={handleMarkMessageRead}
            isLoading={productAnnouncementsLoading}
          />
        );
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-white text-slate-900">
      {renderScreen()}
    </div>
  );
}
