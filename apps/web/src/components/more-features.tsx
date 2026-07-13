import { useEffect, useState } from 'react';
import type { AppProfile } from '../config/appProfile';
import type { AppTranslations } from '../i18n/translations';
import type { MiniScreenId } from './workbench/types';
import RankProgressBar from './RankProgressBar';
import RenewButton from './more-features/RenewButton';
import MoreFeaturesMenu from './more-features/MoreFeaturesMenu';
import type { MenuItemId } from './more-features/menuConfig';

type MoreFeaturesProps = {
  open: boolean;
  visible: boolean;
  onClose: () => void;
  onQuit: () => void | Promise<void>;
  onOpenScreen: (screenId: MiniScreenId) => void;
  usageCount: number;
  unreadMessageCount: number;
  pendingTodayQueueCount: number;
  actionInboxCount: number;
  profile: AppProfile;
  copy: AppTranslations;
};

const FALLBACK_VERSION = '0.1.0';
export const MORE_FEATURES_DRAWER_WIDTH = 184;
export const MORE_FEATURES_DRAWER_TRANSITION_MS = 300;

export default function MoreFeatures({ open, visible, onClose, onQuit, onOpenScreen, usageCount, unreadMessageCount, pendingTodayQueueCount, actionInboxCount, profile, copy }: MoreFeaturesProps) {
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [hoveredMenuId, setHoveredMenuId] = useState<MenuItemId | null>(null);
  const [appVersion, setAppVersion] = useState(FALLBACK_VERSION);

  useEffect(() => {
    let isMounted = true;

    const loadVersion = async () => {
      if (!window.desktopApp?.getAppVersion) {
        return;
      }

      const version = await window.desktopApp.getAppVersion();
      if (isMounted && version) {
        setAppVersion(version);
      }
    };

    void loadVersion();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(profile.userId);
    setShowCopiedAlert(true);
    window.setTimeout(() => {
      setShowCopiedAlert(false);
    }, 1600);
  };

  return (
    <>
      <aside
        aria-hidden={!open}
        style={{ width: MORE_FEATURES_DRAWER_WIDTH }}
        className={[
          'absolute inset-y-0 left-[390px] z-0 flex flex-col overflow-hidden rounded-r-[18px]',
          'bg-[linear-gradient(180deg,rgba(180,174,176,0.96),rgba(171,162,165,0.98)_58%,rgba(202,151,123,0.94))] text-[#231f20] shadow-[0_10px_28px_rgba(78,64,62,0.16)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
          visible ? 'visible' : 'invisible',
          open
            ? 'pointer-events-auto translate-x-0'
            : 'pointer-events-none -translate-x-full',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-emerald-100 bg-white/96 px-3 py-1 text-[10px] font-medium text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.10)] transition-all duration-250',
            showCopiedAlert ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          {copy.moreFeatures.copied}
        </div>

        <div className="px-5 pb-3 pt-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#ef5d8f,#db4d83)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(255,192,211,0.32)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60">
              RA
            </div>
          </div>

          <p
            className="mt-3 max-w-full truncate px-1 text-center text-[16px] font-semibold tracking-[0.01em] text-[#231f20]"
            title={profile.displayName}
          >
            {profile.displayName}
          </p>
          <p className="mt-1 text-center text-[10px] text-[#6a5a5f]">
            {usageCount} {copy.moreFeatures.repliesGenerated}
          </p>
          <RankProgressBar
            usageCount={usageCount}
            toNextRank={copy.moreFeatures.toNextRank}
            maxRank={copy.moreFeatures.maxRank}
            rankLabels={copy.moreFeatures.rankLabels}
          />
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#3f3738]">
            <span>{copy.moreFeatures.userIdLabel}: {profile.userId}</span>
            <button
              type="button"
              className="flex items-center justify-center rounded-full border border-white/70 bg-white/88 p-1 text-[#b04a70] shadow-[0_6px_14px_rgba(15,23,42,0.08)] transition hover:scale-[1.03] hover:bg-white hover:text-[#9f4266] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/70"
              onClick={handleCopyId}
              aria-label={copy.moreFeatures.copyUserId}
              title={copy.moreFeatures.copyUserId}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.9" />
                <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 pb-7">
          <div className="clean-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 text-[11px] text-[#231f20]">
            <MoreFeaturesMenu
              copy={copy}
              hoveredMenuId={hoveredMenuId}
              unreadMessageCount={unreadMessageCount}
              pendingTodayQueueCount={pendingTodayQueueCount}
              actionInboxCount={actionInboxCount}
              onHover={setHoveredMenuId}
              onOpenScreen={onOpenScreen}
            />
          </div>

          <div className="mt-auto space-y-2 pt-4">
            <RenewButton copy={copy} />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#8e7f82] bg-white/28 px-3 py-1.5 text-[11px] text-[#231f20] transition hover:scale-[1.01] hover:bg-white/36 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
              onClick={() => {
                void onQuit();
              }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#8f8a8d]" fill="none" aria-hidden="true">
                <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              {copy.moreFeatures.quit}
            </button>
          </div>

          <div className="mt-3 text-[10px] text-[#3f3738]">
            {copy.moreFeatures.version}: {appVersion}
          </div>
        </div>
      </aside>
    </>
  );
}
