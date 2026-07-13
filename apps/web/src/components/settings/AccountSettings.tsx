import { useCallback, useEffect, useState } from 'react';
import MiniScreenFrame from '../MiniScreenFrame';
import AuthShell from '../../auth/AuthShell';
import { useAuth } from '../../auth/AuthProvider';
import { useAppSettings } from '../../hooks/useAppSettings';
import {
  fetchProfileFromSupabase,
  syncPhoneNumberToSupabase,
  syncProfileToSupabase,
} from '../../auth/profileSync';
import type { AppProfile } from '../../config/appProfile';
import type { AppTranslations } from '../../i18n/translations';
import InternationalPhoneField from './InternationalPhoneField';

type AccountSettingsProps = {
  onClose: () => void;
  onOpenDeleteAccount: () => void;
  profile: AppProfile;
  onSetProfile: (key: keyof AppProfile, value: string) => void;
  copy: AppTranslations;
};

type AccountRoute = 'hub' | 'profile' | 'phone' | 'change-password';

const DISPLAY_NAME_MAX_LENGTH = 24;

function normalizeDisplayName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsRow({
  label,
  value,
  onClick,
  danger,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-3 border-b border-[#f0dbe3] px-4 py-3 text-left last:border-b-0',
        interactive ? 'transition hover:bg-[#fff5f9]' : 'cursor-default',
      ].join(' ')}
    >
      <div className="min-w-0">
        <p className={['text-[12px] font-medium', danger ? 'text-[#c15480]' : 'text-slate-800'].join(' ')}>
          {label}
        </p>
        {value ? (
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{value}</p>
        ) : null}
      </div>
      {interactive ? <ChevronRight /> : null}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-1 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 first:pt-0">
      {title}
    </p>
  );
}

function DetailHeader({
  title,
  onBack,
  isEditing,
  onEdit,
  onSave,
  editLabel,
  saveLabel,
  saveDisabled,
}: {
  title: string;
  onBack: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  editLabel: string;
  saveLabel: string;
  saveDisabled?: boolean;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fcfcfd] px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f2d6e0] bg-white text-slate-500 transition hover:border-[#e7aac2] hover:text-[#d86a94]"
        aria-label="Back"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <p className="min-w-0 flex-1 text-center text-[13px] font-semibold text-slate-900">{title}</p>
      {isEditing ? (
        <button
          type="button"
          disabled={saveDisabled}
          onClick={onSave}
          className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition disabled:cursor-not-allowed disabled:bg-[#f0b8cc]"
        >
          {saveLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f2d6e0] bg-white text-[#bf5a83] transition hover:border-[#e7aac2]"
          aria-label={editLabel}
          title={editLabel}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function AccountSettings({
  onClose,
  onOpenDeleteAccount,
  profile,
  onSetProfile,
  copy,
}: AccountSettingsProps) {
  const { user, signOut } = useAuth();
  const { settings } = useAppSettings();
  const ac = copy.accountSettings;
  const sd = copy.settings;

  const [route, setRoute] = useState<AccountRoute>('hub');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneHasDigits, setPhoneHasDigits] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState(profile.displayName);
  const [copiedField, setCopiedField] = useState<'user-id' | 'referral-code' | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void fetchProfileFromSupabase(user.id).then(row => {
      if (!row) return;
      const nextPhone = row.phone_number?.trim() || '';
      setPhoneNumber(nextPhone);
      setPhoneDraft(nextPhone);
      setPhoneHasDigits(Boolean(nextPhone));
    });
  }, [user?.id]);

  useEffect(() => {
    if (!isProfileEditing) {
      setDisplayNameDraft(profile.displayName.slice(0, DISPLAY_NAME_MAX_LENGTH));
    }
  }, [isProfileEditing, profile.displayName]);

  const handleCopy = async (value: string, field: 'user-id' | 'referral-code') => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1400);
  };

  const handleConfirmSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      onClose();
    } finally {
      setIsSigningOut(false);
      setShowSignOutConfirm(false);
    }
  }, [onClose, signOut]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    const normalized = normalizeDisplayName(displayNameDraft).slice(0, DISPLAY_NAME_MAX_LENGTH);
    if (!normalized) return;

    setIsSavingProfile(true);
    onSetProfile('displayName', normalized);
    await syncProfileToSupabase(user.id, { ...profile, displayName: normalized });
    setIsSavingProfile(false);
    setIsProfileEditing(false);
  };

  const handleSavePhone = async () => {
    if (!user?.id) return;

    if (phoneHasDigits && !phoneDraft.trim()) {
      setPhoneError(ac.phoneInvalid);
      return;
    }

    setIsSavingPhone(true);
    setPhoneError('');
    const normalized = phoneDraft.trim();
    const ok = await syncPhoneNumberToSupabase(user.id, normalized);
    setIsSavingPhone(false);
    if (!ok) {
      setPhoneError(ac.phoneSaveFailed);
      return;
    }

    setPhoneNumber(normalized);
    setIsPhoneEditing(false);
    setPhoneHasDigits(Boolean(normalized));
  };

  if (route === 'change-password') {
    return (
      <AuthShell
        initialRoute="change-password"
        onClose={() => setRoute('hub')}
      />
    );
  }

  if (route === 'profile') {
    return (
      <MiniScreenFrame
        label={ac.frameLabel}
        title={ac.profileDetails}
        onClose={onClose}
        backLabel={copy.miniScreen.back}
        contentClassName="bg-[#fcfcfd]"
        contentScrollable={false}
        headerAccessory={
          copiedField ? (
            <div className="rounded-full border border-emerald-100 bg-white/96 px-3 py-1 text-[10px] font-medium text-emerald-700">
              {copy.moreFeatures.copied}
            </div>
          ) : null
        }
      >
        <DetailHeader
          title={ac.profileDetails}
          onBack={() => {
            setIsProfileEditing(false);
            setRoute('hub');
          }}
          isEditing={isProfileEditing}
          onEdit={() => setIsProfileEditing(true)}
          onSave={() => void handleSaveProfile()}
          editLabel={ac.edit}
          saveLabel={ac.save}
          saveDisabled={isSavingProfile || !normalizeDisplayName(displayNameDraft)}
        />
        <div className="clean-scrollbar overflow-y-auto px-4 pb-6 pt-4">
          <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#fffafb] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="space-y-3 px-4 py-4">
              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{sd.displayNameLabel}</span>
                {isProfileEditing ? (
                  <div className="mt-1 rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2">
                    <input
                      type="text"
                      value={displayNameDraft}
                      onChange={event => {
                        const value = event.currentTarget.value;
                        if (value.length <= DISPLAY_NAME_MAX_LENGTH) {
                          setDisplayNameDraft(value);
                        }
                      }}
                      placeholder={sd.displayNamePlaceholder}
                      className="w-full border-0 bg-transparent text-[12px] font-medium text-slate-800 outline-none"
                      autoFocus
                    />
                    <p className="mt-2 text-[10px] text-slate-500">
                      {displayNameDraft.length}/{DISPLAY_NAME_MAX_LENGTH} {sd.nameLimitLabel}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[12px] font-medium text-slate-800">{profile.displayName}</p>
                )}
              </label>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{sd.userIdLabel}</span>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={profile.userId}
                    readOnly
                    className="w-full cursor-default select-all rounded-[10px] border border-[#edd7e0] bg-slate-50 px-3 py-2 pr-10 text-[11px] text-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#ead3dd] bg-white p-1.5 text-[#bf5a83] transition hover:border-[#e7aac2]"
                    onClick={() => void handleCopy(profile.userId, 'user-id')}
                    aria-label={copy.moreFeatures.copyUserId}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.9" />
                      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{sd.referralCodeLabel}</span>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={profile.referralCode}
                    readOnly
                    className="w-full cursor-default select-all rounded-[10px] border border-[#edd7e0] bg-slate-50 px-3 py-2 pr-10 text-[11px] text-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#ead3dd] bg-white p-1.5 text-[#bf5a83] transition hover:border-[#e7aac2]"
                    onClick={() => void handleCopy(profile.referralCode, 'referral-code')}
                    aria-label={sd.copyReferralCode}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.9" />
                      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </label>
            </div>
          </div>
        </div>
      </MiniScreenFrame>
    );
  }

  if (route === 'phone') {
    return (
      <MiniScreenFrame
        label={ac.frameLabel}
        title={ac.phoneNumber}
        onClose={onClose}
        backLabel={copy.miniScreen.back}
        contentClassName="bg-[#fcfcfd]"
        contentScrollable={false}
      >
        <DetailHeader
          title={ac.phoneNumber}
          onBack={() => {
            setIsPhoneEditing(false);
            setPhoneDraft(phoneNumber);
            setPhoneHasDigits(Boolean(phoneNumber.trim()));
            setPhoneError('');
            setRoute('hub');
          }}
          isEditing={isPhoneEditing}
          onEdit={() => {
            setPhoneDraft(phoneNumber);
            setPhoneHasDigits(Boolean(phoneNumber.trim()));
            setPhoneError('');
            setIsPhoneEditing(true);
          }}
          onSave={() => void handleSavePhone()}
          editLabel={ac.edit}
          saveLabel={ac.save}
          saveDisabled={isSavingPhone || (phoneHasDigits && !phoneDraft.trim())}
        />
        <div className="px-4 pb-6 pt-4">
          <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {isPhoneEditing ? (
              <InternationalPhoneField
                valueE164={phoneNumber}
                onChangeE164={setPhoneDraft}
                language={settings.defaultLanguage}
                copy={ac}
                error={phoneError}
                onClearError={() => setPhoneError('')}
                onNationalDigitsChange={setPhoneHasDigits}
                autoFocus
              />
            ) : (
              <p className="text-[12px] font-medium text-slate-800">
                {phoneNumber.trim() || ac.phoneNotSet}
              </p>
            )}
          </div>
        </div>
      </MiniScreenFrame>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MiniScreenFrame
      label={ac.frameLabel}
      title={ac.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
      contentOverlay={showSignOutConfirm ? (
        <div className="flex h-full items-center justify-center bg-[#0f172a]/32 px-3 backdrop-blur-[3px]">
          <section
            role="alertdialog"
            aria-labelledby="sign-out-confirm-title"
            className="w-full max-w-[300px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
          >
            <p id="sign-out-confirm-title" className="text-[13px] font-semibold text-slate-900">
              {ac.signOutConfirmTitle}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              {ac.signOutConfirmBody}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-[#e7aac2]"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
              >
                {sd.cancel}
              </button>
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition disabled:cursor-not-allowed disabled:bg-[#f0b8cc]"
                onClick={() => void handleConfirmSignOut()}
                disabled={isSigningOut}
              >
                {isSigningOut ? copy.auth.working : ac.signOut}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    >
      <div className="px-5 py-5">
        <SectionHeader title={ac.profileSection} />
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#fffafb] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <SettingsRow
            label={ac.profileDetails}
            value={profile.displayName}
            onClick={() => setRoute('profile')}
          />
        </div>

        <SectionHeader title={ac.accountSection} />
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#fffafb] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <SettingsRow label={ac.emailLabel} value={user.email ?? ''} />
          <SettingsRow
            label={ac.phoneNumber}
            value={phoneNumber.trim() || ac.phoneNotSet}
            onClick={() => setRoute('phone')}
          />
          <SettingsRow
            label={ac.changePassword}
            onClick={() => setRoute('change-password')}
          />
        </div>

        <SectionHeader title={ac.sessionSection} />
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#fffafb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#edd7e0] bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:border-[#e7aac2] hover:bg-[#fff5f9] hover:text-[#b04a70] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setShowSignOutConfirm(true)}
            disabled={isSigningOut}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#bf5a83]" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {ac.signOut}
          </button>
        </div>

        <SectionHeader title={ac.dangerSection} />
        <div className="overflow-hidden rounded-[16px] border border-[#f0dbe3] bg-[#fff5f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <SettingsRow
            label={ac.deleteAccount}
            onClick={onOpenDeleteAccount}
            danger
          />
        </div>
      </div>
    </MiniScreenFrame>
  );
}
