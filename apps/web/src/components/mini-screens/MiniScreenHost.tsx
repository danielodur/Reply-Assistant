import type { RefObject } from 'react';
import type { AppProfile } from '../../config/appProfile';
import type { AppSettings } from '../../hooks/useAppSettings';
import type { BusinessContext, BusinessContextKey } from '../../config/businessContext';
import type { ContactMemoryProfile, ContactStage, ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { useActionInbox } from '../../hooks/useActionInbox';
import type { useTodayQueue } from '../../hooks/useTodayQueue';
import type { ActionInboxItem } from '../action-inbox/types';
import type { EmailSyncUpdate } from '../contacts/emailSyncTypes';
import ActionInbox from '../ActionInbox';
import BusinessContextScreen from '../BusinessContext';
import ContactThreads from '../ContactThreads';
import CustomerService from '../customer-service';
import Messages from '../Messages';
import RecentReplies from '../RecentReplies';
import ReferFriends from '../refer-friends';
import Settings from '../Settings';
import SnippetLibrary from '../SnippetLibrary';
import ResetData from '../ResetData';
import TodayQueue, { type QueueTask, type TodayQueueAction } from '../TodayQueue';
import WeeklyRecap from '../WeeklyRecap';
import MiniScreenFrame from '../MiniScreenFrame';
import type { MiniScreenId, ReplyHistoryItem } from '../workbench/types';
import type { ProductAnnouncement } from '../../config/productAnnouncements';
import { isAppFoundationEmpty } from '../../lib/isAppFoundationEmpty';

type TodayQueueHook = ReturnType<typeof useTodayQueue>;

type ActionInboxHook = Pick<
  ReturnType<typeof useActionInbox>,
  'pendingItems' | 'analytics' | 'completionRate' | 'removePending'
>;

export type MiniScreenHostProps = {
  screenId: MiniScreenId;
  copy: AppTranslations;
  onClose: () => void;
  onOpenScreen: (screenId: MiniScreenId) => void;
  unreadMessageCount: number;
  snippetCount: number;
  recentReplies: ReplyHistoryItem[];
  businessContext: BusinessContext;
  contactFollowUpTasks: QueueTask[];
  insightTasks: QueueTask[];
  onRunTodayTask: (action: TodayQueueAction) => void | Promise<void>;
  todayQueue: TodayQueueHook;
  contactThreads: ContactThread[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null, thread?: ContactThread | null) => void;
  onCreateContact: (input: {
    name: string;
    company?: string;
    email?: string;
    stage?: ContactStage;
    notes?: string;
    memoryProfile?: ContactMemoryProfile;
  }) => ContactThread;
  onRemoveContact: (contactId: string) => void;
  onAddMessage: (contactId: string, text: string) => void;
  onUpdateChatContext: (contactId: string, chatContext: string) => void;
  onSaveMemory: (contactId: string, profile: ContactMemoryProfile) => void;
  onSaveAndCompose: (contactId: string, text: string) => void;
  inputTextareaRef: RefObject<HTMLTextAreaElement | null>;
  actionInbox: ActionInboxHook;
  onActionInboxDoNow: (item: ActionInboxItem) => void | Promise<void>;
  settings: AppSettings;
  profile: AppProfile;
  onToggleSetting: (key: keyof AppSettings) => void;
  onSetSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSetProfileField: (key: keyof AppProfile, value: string) => void;
  onApplyChatContextUpdates: (updates: EmailSyncUpdate[]) => void;
  productAnnouncements: ProductAnnouncement[];
  readMessageIds: string[];
  onMarkMessageRead: (id: string) => void;
  productAnnouncementsLoading?: boolean;
  onUseComposerText: (value: string) => void;
  onSetBusinessContextField: (key: BusinessContextKey, value: string) => void;
  onSmartReply?: (contact: ContactThread) => void;
  onReplayTour?: () => void;
};

export default function MiniScreenHost(props: MiniScreenHostProps) {
  const {
    screenId,
    copy,
    onClose,
    onOpenScreen,
    unreadMessageCount,
    snippetCount,
    recentReplies,
    businessContext,
    contactFollowUpTasks,
    insightTasks,
    onRunTodayTask,
    todayQueue,
    contactThreads,
    selectedContactId,
    onSelectContact,
    onCreateContact,
    onRemoveContact,
    onAddMessage,
    onUpdateChatContext,
    onSaveMemory,
    onSaveAndCompose,
    inputTextareaRef,
    actionInbox,
    onActionInboxDoNow,
    settings,
    profile,
    onToggleSetting,
    onSetSetting,
    onSetProfileField,
    onApplyChatContextUpdates,
    productAnnouncements,
    readMessageIds,
    onMarkMessageRead,
    productAnnouncementsLoading,
    onUseComposerText,
    onSetBusinessContextField,
    onSmartReply,
    onReplayTour,
  } = props;

  const foundationEmpty = isAppFoundationEmpty(contactThreads);

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
          extraTasks={[...contactFollowUpTasks, ...insightTasks]}
          onRunTask={onRunTodayTask}
          isDone={todayQueue.isDone}
          analytics={todayQueue.analytics}
          markDone={todayQueue.markDone}
          markUsedNow={todayQueue.markUsedNow}
        />
      );
    case 'contact-threads':
      return (
        <ContactThreads
          onClose={onClose}
          copy={copy}
          threads={contactThreads}
          selectedContactId={selectedContactId}
          onSelectContact={onSelectContact}
          onCreateContact={onCreateContact}
          onRemoveContact={onRemoveContact}
          onAddMessage={onAddMessage}
          onUpdateChatContext={onUpdateChatContext}
          onSaveMemory={onSaveMemory}
          onSaveAndCompose={(contactId, text) => {
            onSaveAndCompose(contactId, text);
            onClose();
            window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
          }}
          onSmartReply={contact => {
            onSmartReply?.(contact);
            onClose();
          }}
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
          onDoNow={onActionInboxDoNow}
          onRemove={actionInbox.removePending}
          foundationEmpty={foundationEmpty}
          onOpenScreen={onOpenScreen}
        />
      );
    case 'settings':
      return (
        <Settings
          onClose={onClose}
          settings={settings}
          profile={profile}
          onToggle={onToggleSetting}
          onSet={onSetSetting}
          onSetProfile={onSetProfileField}
          copy={copy}
          contacts={contactThreads}
          preferredTargetContactId={selectedContactId}
          onApplyChatContextUpdates={onApplyChatContextUpdates}
          onReplayTour={onReplayTour}
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
          onMarkRead={onMarkMessageRead}
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
          onOpenScreen={onOpenScreen}
          onUse={value => {
            onUseComposerText(value);
            onClose();
          }}
        />
      );
    case 'snippet-library':
      return (
        <SnippetLibrary
          onClose={onClose}
          copy={copy}
          onUse={value => {
            onUseComposerText(value);
            onClose();
          }}
        />
      );
    case 'reset-data':
      return (
        <ResetData
          onClose={onClose}
          copy={copy}
          foundationEmpty={foundationEmpty}
          onOpenScreen={onOpenScreen}
        />
      );
    case 'business-context':
      return (
        <BusinessContextScreen
          onClose={onClose}
          context={businessContext}
          onSetField={onSetBusinessContextField}
          copy={copy}
        />
      );
    case 'weekly-recap':
      return (
        <WeeklyRecap
          onClose={onClose}
          copy={copy}
          recentRepliesRecipients={recentReplies.map(reply => reply.recipient)}
          contacts={contactThreads}
          foundationEmpty={foundationEmpty}
          onOpenScreen={onOpenScreen}
        />
      );
    default:
      return (
        <MiniScreenFrame
          label={copy.moreFeatures.menuLabels.settings}
          title="Screen unavailable"
          onClose={onClose}
          backLabel={copy.miniScreen.back}
          contentClassName="bg-[#fcfcfd] px-4 pt-4 pb-6"
        >
          <p className="rounded-[12px] border border-[#edd7e0] bg-white px-3 py-3 text-[11px] text-slate-600">
            This panel could not be opened. Please try again.
          </p>
        </MiniScreenFrame>
      );
  }
}
