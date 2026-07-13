import { useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import type { AppProfile } from '../config/appProfile';
import type { AppTranslations } from '../i18n/translations';

type ReferFriendsProps = {
  onClose: () => void;
  profile: AppProfile;
  copy: AppTranslations;
  compact?: boolean;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function OffersList({ offers, emptyRewards }: { offers: Array<{ title: string; desc: string }>; emptyRewards: string }) {
  const [focusedOfferTitle, setFocusedOfferTitle] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {offers.map(offer => {
        const isFocused = focusedOfferTitle === offer.title;
        return (
          <div
            key={offer.title}
            onMouseEnter={() => setFocusedOfferTitle(offer.title)}
            onMouseLeave={() => setFocusedOfferTitle(null)}
            className={[
              'rounded-[16px] border bg-white px-4 py-3 transition-all duration-200',
              isFocused
                ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                : 'border-slate-200',
            ].join(' ')}
          >
            <p className="text-[12px] font-semibold text-slate-900">{offer.title}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{offer.desc}</p>
          </div>
        );
      })}
      <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
        <p className="text-[11px] text-slate-400">{emptyRewards}</p>
      </div>
    </div>
  );
}

export default function ReferFriends({ onClose, profile, copy, compact = false }: ReferFriendsProps) {
  const [inviteCopied, setInviteCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeCopyPulse, setCodeCopyPulse] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(profile.referralCode);
    setCodeCopied(true);
    setCodeCopyPulse(true);
    window.setTimeout(() => setCodeCopyPulse(false), 320);
    window.setTimeout(() => setCodeCopied(false), 1400);
  };

  const handleInvite = async () => {
    const message = copy.referFriends.inviteMessage.replace('{{code}}', profile.referralCode);
    await navigator.clipboard.writeText(message);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1400);
  };

  return (
    <MiniScreenFrame
      label={copy.referFriends.frameLabel}
      title={copy.referFriends.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      containerClassName={compact ? 'h-auto max-h-[min(520px,calc(100vh-80px))] w-[min(360px,calc(100vw-32px))]' : undefined}
      contentClassName={compact ? 'flex h-auto flex-col bg-[#fcfcfd]' : 'flex flex-col bg-[#fcfcfd]'}
      contentScrollable={!compact}
      headerAccessory={
        <div
          className={[
            'pointer-events-none whitespace-nowrap rounded-full border border-emerald-100 bg-white/96 px-3 py-1 text-[10px] font-medium text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.10)] transition-all duration-250',
            codeCopied ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          {copy.referFriends.copiedToClipboard}
        </div>
      }
    >
      <div className={compact ? 'px-4 py-4' : 'px-5 py-5'}>
        <div className={[
          'mx-auto flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#ffe4ef,#f7bfd4)] text-[#dd5f91] shadow-[0_16px_32px_rgba(232,92,139,0.18)]',
          compact ? 'h-16 w-16' : 'h-28 w-28',
        ].join(' ')}>
          <svg viewBox="0 0 24 24" className={compact ? 'h-8 w-8' : 'h-14 w-14'} fill="none" aria-hidden="true">
            <path d="M12 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 9h16v12H4z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.5 5.2c0 1.3 1.1 2.3 3.5 3.8c2.4-1.5 3.5-2.5 3.5-3.8c0-1.3-1.1-2.2-2.3-2.2c-.8 0-1.6.4-2.1 1.1c-.5-.7-1.3-1.1-2.1-1.1c-1.2 0-2.5.9-2.5 2.2Z" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <p className={['text-center text-[13px] font-semibold text-slate-900', compact ? 'mt-3' : 'mt-5'].join(' ')}>{copy.referFriends.heroTitle}</p>
        <p className="mt-2 text-center text-[11px] leading-5 text-slate-600">
          {copy.referFriends.heroBody}
        </p>

        <div className="mt-4 rounded-[16px] border border-[#f4d7e1] bg-[linear-gradient(180deg,#fff5f9,#fde9f1)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d86a94]">{copy.referFriends.referralCodeTitle}</p>
          <div className="relative mt-2 rounded-[14px] border border-[#f3c9d8] bg-white px-4 py-3 pr-12 text-center text-[18px] font-semibold tracking-[0.08em] text-slate-900">
            {profile.referralCode}
            <button
              type="button"
              className={[
                'absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white p-1.5 transition-all duration-200',
                codeCopyPulse
                  ? 'scale-90 border-emerald-200 bg-emerald-50 text-emerald-600 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                  : 'border-[#ead3dd] text-[#bf5a83] hover:border-[#e7aac2] hover:text-[#a84b71] active:scale-95',
              ].join(' ')}
              onClick={() => {
                void handleCopyCode();
              }}
              aria-label={copy.referFriends.copyReferralCode}
              title={copy.referFriends.copyReferralCode}
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-[14px] bg-[#dd5f91] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-[#cf5487]"
          onClick={() => {
            void handleInvite();
          }}
        >
          {inviteCopied ? copy.referFriends.inviteCopied : copy.referFriends.inviteFriends}
        </button>
      </div>

      {!compact ? (
      <div className="border-t border-slate-200 bg-[#fcfcfd] px-5 pt-5 pb-7">
        <OffersList offers={copy.referFriends.offers} emptyRewards={copy.referFriends.emptyRewards} />
      </div>
      ) : null}
    </MiniScreenFrame>
  );
}
