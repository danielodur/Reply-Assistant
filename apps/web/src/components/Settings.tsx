import { useEffect, useMemo, useRef, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import { useAuth } from '../auth/AuthProvider';
import type { AppSettings } from '../hooks/useAppSettings';
import type { AppProfile } from '../config/appProfile';
import type { ContactThread } from '../config/contactThreads';
import type { AppTranslations } from '../i18n/translations';
import type { EmailSyncUpdate } from './contacts/emailSyncTypes';
import type { SyncServer } from './contacts/syncServerMeta';
import SyncGuideModal from './contacts/SyncGuideModal';
import SyncServerModal from './contacts/SyncServerModal';
import AccountSettings from './settings/AccountSettings';
import DeleteAccount from './settings/DeleteAccount';

type SettingsProps = {
  onClose: () => void;
  settings: AppSettings;
  profile: AppProfile;
  onToggle: (key: keyof AppSettings) => void;
  onSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSetProfile: (key: keyof AppProfile, value: string) => void;
  copy: AppTranslations;
  contacts: ContactThread[];
  preferredTargetContactId: string | null;
  onApplyChatContextUpdates: (updates: EmailSyncUpdate[]) => void;
  onReplayTour?: () => void;
};

type SettingsOverlay = null | 'account-settings' | 'delete-account';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={[
        'flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors duration-200',
        on ? 'justify-end bg-[#E85C8B]' : 'justify-start bg-slate-200',
      ].join(' ')}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200" />
    </button>
  );
}

const DISPLAY_NAME_MAX_LENGTH = 24;

function normalizeDisplayName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export default function Settings({
  onClose,
  settings,
  profile,
  onToggle,
  onSet,
  onSetProfile,
  copy,
  contacts,
  preferredTargetContactId,
  onApplyChatContextUpdates,
  onReplayTour,
}: SettingsProps) {
  const [settingsOverlay, setSettingsOverlay] = useState<SettingsOverlay>(null);
  const [showSyncServerMenu, setShowSyncServerMenu] = useState(false);
  const [showSyncServerModal, setShowSyncServerModal] = useState(false);
  const [showSyncGuideModal, setShowSyncGuideModal] = useState(false);
  const [activeSyncServer, setActiveSyncServer] = useState<SyncServer>('email');
  const [guideServer, setGuideServer] = useState<SyncServer | null>(null);
  const syncMenuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!showSyncServerMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (syncMenuRef.current && !syncMenuRef.current.contains(target)) {
        setShowSyncServerMenu(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showSyncServerMenu]);

  const syncConnected = useMemo(() => {
    const base = {
      email: false,
      dingtalk: false,
      wechat: false,
      whatsapp: false,
      telegram: false,
    };

    if (typeof window === 'undefined') return base;

    try {
      const emailRaw = window.localStorage.getItem('replyAssistantConnectedEmail');
      const dingTalkRaw = window.localStorage.getItem('replyAssistantConnected_dingtalk');

      const email = emailRaw ? (JSON.parse(emailRaw) as { username?: string; password?: string }) : null;
      const dingtalk = dingTalkRaw ? (JSON.parse(dingTalkRaw) as { appKey?: string }) : null;

      return {
        ...base,
        email: Boolean(email?.username?.trim() && email?.password?.trim()),
        dingtalk: Boolean(dingtalk?.appKey?.trim()),
      };
    } catch {
      return base;
    }
  }, [showSyncServerMenu, showSyncServerModal]);

  useEffect(() => {
    const normalized = normalizeDisplayName(profile.displayName).slice(0, DISPLAY_NAME_MAX_LENGTH);
    if (normalized && normalized !== profile.displayName) {
      onSetProfile('displayName', normalized);
    }
  }, [onSetProfile, profile.displayName]);

  if (settingsOverlay === 'delete-account') {
    return (
      <DeleteAccount
        onClose={() => setSettingsOverlay('account-settings')}
        onDeleted={onClose}
        copy={copy}
      />
    );
  }

  if (settingsOverlay === 'account-settings') {
    return (
      <AccountSettings
        onClose={() => setSettingsOverlay(null)}
        onOpenDeleteAccount={() => setSettingsOverlay('delete-account')}
        profile={profile}
        onSetProfile={onSetProfile}
        copy={copy}
      />
    );
  }

  return (
    <MiniScreenFrame
      label={copy.settings.frameLabel}
      title={copy.settings.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="flex flex-col bg-[#fcfcfd]"
    >
      <SyncServerModal
        copy={copy}
        open={showSyncServerModal}
        contacts={contacts}
        preferredTargetContactId={preferredTargetContactId}
        initialServer={activeSyncServer}
        onClose={() => setShowSyncServerModal(false)}
        onApplyUpdates={onApplyChatContextUpdates}
      />

      <SyncGuideModal
        copy={copy}
        open={showSyncGuideModal}
        server={guideServer}
        onClose={() => {
          setShowSyncGuideModal(false);
          setGuideServer(null);
        }}
        onContinue={() => {
          if (!guideServer) return;
          setActiveSyncServer(guideServer);
          setShowSyncGuideModal(false);
          setGuideServer(null);
          setShowSyncServerModal(true);
        }}
      />

      <div className="px-5 py-5">
        <div className="space-y-3">
          {user ? (
            <div className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.accountTitle}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {user.email ?? copy.settings.accountDesc}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f2d6e0] bg-white text-[#bf5a83] transition hover:border-[#e7aac2] hover:bg-[#fff5f9] hover:text-[#a84b71] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
                onClick={() => setSettingsOverlay('account-settings')}
                aria-label={copy.accountSettings.openAccountSettings}
                title={copy.accountSettings.openAccountSettings}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5Z" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M19.5 12a7.5 7.5 0 0 0-.1-1.23l2.02-1.57l-1.9-3.29l-2.45.8a7.63 7.63 0 0 0-2.13-1.23L14.5 3h-5l-.44 2.48c-.76.27-1.47.69-2.13 1.23l-2.45-.8l-1.9 3.29l2.02 1.57c-.07.4-.1.81-.1 1.23s.03.83.1 1.23L2.58 14.8l1.9 3.29l2.45-.8c.66.54 1.37.96 2.13 1.23L9.5 21h5l.44-2.48c.76-.27 1.47-.69 2.13-1.23l2.45.8l1.9-3.29l-2.02-1.57c.07-.4.1-.81.1-1.23Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[13px] font-medium text-slate-900">{copy.settings.syncedServersTitle}</p>
            <p className="mt-1 text-[11px] text-slate-500">{copy.settings.syncedServersDesc}</p>
            <p className="mt-2 text-[10px] leading-snug text-slate-400">{copy.settings.syncPrivacyFootnote}</p>

            <div ref={syncMenuRef} className="relative mt-3">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-left text-[11px] font-medium text-slate-700 outline-none transition hover:border-[#e7aac2]"
                onClick={() => setShowSyncServerMenu(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={showSyncServerMenu}
              >
                <span>{copy.contactThreads.syncServersLabel}</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" aria-hidden="true">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showSyncServerMenu ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[12px] border border-[#f0dbe3] bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
                  {[
                    { id: 'email' as const, label: copy.contactThreads.syncServerEmail },
                    { id: 'dingtalk' as const, label: copy.contactThreads.syncServerDingTalk },
                    { id: 'wechat' as const, label: copy.contactThreads.syncServerWeChat },
                    { id: 'whatsapp' as const, label: copy.contactThreads.syncServerWhatsApp },
                    { id: 'telegram' as const, label: copy.contactThreads.syncServerTelegram },
                  ].map(server => (
                    <button
                      key={server.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-[9px] px-2.5 py-1.5 text-left text-[10px] font-medium text-slate-600 transition hover:bg-[#fff5f9] hover:text-[#c15480]"
                      onClick={() => {
                        setShowSyncServerMenu(false);
                        setGuideServer(server.id);
                        setShowSyncGuideModal(true);
                      }}
                    >
                      <span>{server.label}</span>
                      {syncConnected[server.id] ? (
                        <span className="inline-flex items-center text-emerald-600" aria-label="connected">
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M6.5 10.5l2.2 2.2 4.8-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.lazyModeTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.lazyModeDesc}</p>
              </div>
              <Toggle on={settings.lazyMode} onToggle={() => onToggle('lazyMode')} />
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.highStakesGuardTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.highStakesGuardDesc}</p>
              </div>
              <Toggle on={settings.highStakesGuard} onToggle={() => onToggle('highStakesGuard')} />
            </div>
          </div>

          {onReplayTour ? (
            <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-slate-900">{copy.guidedTour.replayTitle}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{copy.guidedTour.replayDescription}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d94f7f]"
                  onClick={() => {
                    onReplayTour();
                    onClose();
                  }}
                >
                  {copy.guidedTour.replayButton}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.nativeNotificationsTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.nativeNotificationsDesc}</p>
              </div>
              <Toggle on={settings.nativeNotifications} onToggle={() => onToggle('nativeNotifications')} />
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.quietHoursTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.quietHoursDesc}</p>
              </div>
              <Toggle on={settings.quietHoursEnabled} onToggle={() => onToggle('quietHoursEnabled')} />
            </div>
            {settings.quietHoursEnabled ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-medium">{copy.settings.quietHoursStartLabel}</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={event => onSet('quietHoursStart', event.currentTarget.value)}
                    className="rounded-[8px] border border-[#edd7e0] bg-white px-2 py-1 text-[11px] text-slate-700 outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-medium">{copy.settings.quietHoursEndLabel}</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={event => onSet('quietHoursEnd', event.currentTarget.value)}
                    className="rounded-[8px] border border-[#edd7e0] bg-white px-2 py-1 text-[11px] text-slate-700 outline-none"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.autoCopyTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.autoCopyDesc}</p>
              </div>
              <Toggle on={settings.autoCopy} onToggle={() => onToggle('autoCopy')} />
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{copy.settings.compactModeTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{copy.settings.compactModeDesc}</p>
              </div>
              <Toggle on={settings.compactMode} onToggle={() => onToggle('compactMode')} />
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[13px] font-medium text-slate-900">{copy.settings.focusModeTitle}</p>
            <p className="mt-1 text-[11px] text-slate-500">{copy.settings.focusModeDesc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { value: 'soft', label: copy.settings.focusModeSoft },
                { value: 'strong', label: copy.settings.focusModeStrong },
              ] as const).map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSet('focusMode', option.value)}
                  className={[
                    'rounded-full border px-3 py-1 text-[11px] transition',
                    settings.focusMode === option.value
                      ? 'border-[#e88ab0] bg-[#fde9f2] font-semibold text-[#b84f79]'
                      : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[13px] font-medium text-slate-900">{copy.settings.defaultLanguageTitle}</p>
            <p className="mt-1 text-[11px] text-slate-500">{copy.settings.defaultLanguageDesc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {copy.languageOptions.map(lang => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => onSet('defaultLanguage', lang.value)}
                  className={[
                    'rounded-full border px-3 py-1 text-[11px] transition',
                    settings.defaultLanguage === lang.value
                      ? 'border-[#e88ab0] bg-[#fde9f2] font-semibold text-[#b84f79]'
                      : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                  ].join(' ')}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-slate-400">{copy.settings.keyboardHintsFootnote}</p>
      </div>

      <div className="border-t border-slate-200 bg-[#fcfcfd] px-5 pt-5 pb-7">
        <div className="rounded-[16px] border border-[#f4d7e1] bg-[linear-gradient(180deg,#fff8fb,#fff0f5)] px-4 py-4">
          <p className="text-[12px] font-semibold text-[#c95786]">{copy.settings.profileTitle}</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">
            {copy.settings.profileDesc}
          </p>
        </div>
      </div>
    </MiniScreenFrame>
  );
}
