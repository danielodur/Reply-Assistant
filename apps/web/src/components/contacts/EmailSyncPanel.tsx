import { useEffect, useMemo, useState, useRef } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import { requestEmailSync } from './emailSyncApi';
import type {
  EmailSyncConfig,
  EmailSyncSummary,
  EmailSyncUpdate,
} from './emailSyncTypes';
import { IMAP_PRESETS, type ImapPresetId } from './imapPresets';
import EmailProviderPicker from './EmailProviderPicker';
import { getEmailPasswordHint, toFriendlyEmailSyncError } from './emailSyncErrorHint';
import { getEmailProviderHelp } from './emailProviderHelp';
import { loadSyncDraft, removeSyncDraft, saveSyncDraft } from './syncFormStorage';

type EmailSyncPanelProps = {
  copy: AppTranslations;
  contacts: ContactThread[];
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
  embedded?: boolean;
};

const DEFAULT_CONFIG: EmailSyncConfig = {
  provider: 'imap',
  host: '',
  port: 993,
  secure: true,
  username: '',
  password: '',
  accessToken: '',
  oauthUserEmail: '',
  mailbox: 'INBOX',
  sinceDays: 7,
  maxMessages: 40,
};

const EMAIL_SYNC_STORAGE_KEY = 'replyAssistantSync_email';
const EMAIL_CONNECTED_STORAGE_KEY = 'replyAssistantConnectedEmail';

type StoredEmailDraft = {
  imapPresetId: ImapPresetId;
  username: string;
  password: string;
};

type StoredEmailConnection = StoredEmailDraft & {
  connectedAt: string;
  lastSyncedAt: string;
};

function loadEmailDraft(): StoredEmailDraft {
  const stored = loadSyncDraft<Record<string, unknown>>(EMAIL_SYNC_STORAGE_KEY, {});
  const preset = typeof stored.imapPresetId === 'string' ? stored.imapPresetId : 'qq';
  const imapPresetId: ImapPresetId =
    IMAP_PRESETS.some(item => item.id === preset)
      ? (preset as ImapPresetId)
      : 'qq';

  return {
    imapPresetId,
    username: typeof stored.username === 'string' ? stored.username : '',
    password: typeof stored.password === 'string' ? stored.password : '',
  };
}

function loadConnectedEmail(): StoredEmailConnection | null {
  const stored = loadSyncDraft<Record<string, unknown> | null>(EMAIL_CONNECTED_STORAGE_KEY, null);
  if (!stored || typeof stored !== 'object') return null;

  const username = typeof stored.username === 'string' ? stored.username : '';
  const password = typeof stored.password === 'string' ? stored.password : '';
  const connectedAt = typeof stored.connectedAt === 'string' ? stored.connectedAt : new Date().toISOString();
  const lastSyncedAt = typeof stored.lastSyncedAt === 'string' ? stored.lastSyncedAt : connectedAt;
  const preset = typeof stored.imapPresetId === 'string' ? stored.imapPresetId : 'qq';
  const imapPresetId: ImapPresetId =
    IMAP_PRESETS.some(item => item.id === preset)
      ? (preset as ImapPresetId)
      : 'qq';

  if (!username.trim() || !password.trim()) return null;

  return {
    imapPresetId,
    username,
    password,
    connectedAt,
    lastSyncedAt,
  };
}

export default function EmailSyncPanel({ copy, contacts, onApplyUpdates, embedded = false }: EmailSyncPanelProps) {
  const initialDraft = useMemo(loadEmailDraft, []);
  const initialConnected = useMemo(loadConnectedEmail, []);
  const [isOpen, setIsOpen] = useState(embedded);
  const [config, setConfig] = useState<EmailSyncConfig>({
    ...DEFAULT_CONFIG,
    username: initialConnected?.username ?? initialDraft.username,
    password: initialConnected?.password ?? initialDraft.password,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<EmailSyncSummary | null>(null);
  const [imapPresetId, setImapPresetId] = useState<ImapPresetId>(initialConnected?.imapPresetId ?? initialDraft.imapPresetId);
  const [emailDirty, setEmailDirty] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [syncAlert, setSyncAlert] = useState<{ tone: 'success' | 'failure'; message: string } | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<StoredEmailConnection | null>(initialConnected);
  const [isChangingEmail, setIsChangingEmail] = useState(!initialConnected);
  const alertDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contactsWithEmail = useMemo(
    () => contacts.filter(contact => Boolean(contact.email?.trim())),
    [contacts],
  );

  // Known domains per provider — used for mismatch detection
  const PROVIDER_DOMAINS: Record<ImapPresetId, string[]> = {
    qq:      ['qq.com', 'foxmail.com'],
    '163':   ['163.com'],
    '126':   ['126.com'],
    sina:    ['sina.com', 'sina.cn'],
    sohu:    ['sohu.com'],
    gmail:   ['gmail.com', 'googlemail.com'],
    outlook: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    yahoo:   ['yahoo.com', 'yahoo.co.uk', 'yahoo.com.au', 'ymail.com', 'yahoo.ca', 'yahoo.fr', 'yahoo.de', 'yahoo.it', 'yahoo.es', 'yahoo.co.jp'],
    icloud:  ['icloud.com', 'me.com', 'mac.com'],
    aol:     ['aol.com'],
    zoho:    ['zoho.com', 'zohomail.com'],
  };

  // Industry-standard email validator: RFC-5321 practical subset
  function isEmailValid(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    // Must have exactly one @
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) return false;
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    // Local part: no leading/trailing dot, no consecutive dots, valid chars
    if (!local || /^\.|\.$|\.\.|[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]/.test(local)) return false;
    // Domain: must have at least one dot, no leading/trailing dot/hyphen, valid TLD
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 24 || !/^[a-zA-Z]+$/.test(tld)) return false;
    for (const part of domainParts) {
      if (!part || /^-|-$/.test(part) || !/^[a-zA-Z0-9-]+$/.test(part)) return false;
    }
    return true;
  }

  /**
   * Returns the label of the provider the email domain actually belongs to,
   * or null when the domain matches the selected provider (or is unrecognised).
   */
  function getProviderMismatch(value: string, selectedId: ImapPresetId): string | null {
    const atIndex = value.trim().indexOf('@');
    if (atIndex < 0) return null;
    const emailDomain = value.trim().slice(atIndex + 1).toLowerCase();
    for (const [id, domains] of Object.entries(PROVIDER_DOMAINS) as [ImapPresetId, string[]][]) {
      if (domains.includes(emailDomain)) {
        if (id === selectedId) return null; // correct provider
        const preset = IMAP_PRESETS.find(p => p.id === id);
        return preset?.label ?? null; // mismatch — return the right provider name
      }
    }
    return null; // unknown / custom domain — don't flag it
  }

  async function handleCopyProviderHelp() {
    const providerHelp = getEmailProviderHelp(copy, imapPresetId);
    const payload = [copy.contactThreads.emailProviderHelpTitle, providerHelp].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Keep the UI minimal; ignore clipboard failures silently.
    }
  }

  function handleDisconnect() {
    removeSyncDraft(EMAIL_CONNECTED_STORAGE_KEY);
    setConnectedEmail(null);
    setIsChangingEmail(true);
    setSummary(null);
    setError('');
    setSyncAlert({ tone: 'success', message: copy.contactThreads.emailSyncDisconnected });
    setConfig({
      ...DEFAULT_CONFIG,
      username: '',
      password: '',
    });
    setImapPresetId('qq');
    setEmailDirty(false);
    setEmailTouched(false);
  }

  useEffect(() => {
    saveSyncDraft<StoredEmailDraft>(EMAIL_SYNC_STORAGE_KEY, {
      imapPresetId,
      username: config.username,
      password: config.password || '',
    });
  }, [config.password, config.username, imapPresetId]);

  useEffect(() => {
    return () => {
      if (alertDismissRef.current) clearTimeout(alertDismissRef.current);
    };
  }, []);

  async function handleSync() {
    const email = config.username.trim();
    const code = (config.password || '').trim();

    if (!email) {
      setError(copy.contactThreads.emailSyncErrorAddressMissing);
      setSyncAlert({ tone: 'failure', message: copy.contactThreads.emailSyncErrorAddressMissing });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(copy.contactThreads.emailSyncErrorInvalidEmail);
      setSyncAlert({ tone: 'failure', message: copy.contactThreads.emailSyncErrorInvalidEmail });
      return;
    }

    if (contactsWithEmail.length === 0) {
      setError(copy.contactThreads.emailSyncNeedContactEmail);
      setSyncAlert({ tone: 'failure', message: copy.contactThreads.emailSyncNeedContactEmail });
      return;
    }

    const mismatch = getProviderMismatch(email, imapPresetId);
    if (mismatch) {
      const mismatchMessage = copy.contactThreads.emailSyncErrorProviderMismatch.replace('{provider}', mismatch);
      setError(mismatchMessage);
      setSyncAlert({ tone: 'failure', message: mismatchMessage });
      return;
    }

    if (!code) {
      setError(copy.contactThreads.emailSyncErrorCodeMissing);
      setSyncAlert({ tone: 'failure', message: copy.contactThreads.emailSyncErrorCodeMissing });
      return;
    }

    setIsSyncing(true);
    setError('');
    setSyncAlert(null);

    try {
      const preset = IMAP_PRESETS.find(item => item.id === imapPresetId) ?? IMAP_PRESETS[0];
      const result = await requestEmailSync({
        syncConfig: {
          ...config,
          provider: 'imap',
          host: preset.host,
          port: preset.port,
          secure: preset.secure,
          mailbox: 'INBOX',
          sinceDays: 7,
          maxMessages: 40,
          username: email,
          password: code,
        },
        contacts,
      });

      setSummary(result.summary);
      onApplyUpdates(result.updates);
      const now = new Date().toISOString();
      const nextConnected = {
        imapPresetId,
        username: email,
        password: code,
        connectedAt: connectedEmail?.connectedAt ?? now,
        lastSyncedAt: now,
      };
      saveSyncDraft(EMAIL_CONNECTED_STORAGE_KEY, nextConnected);
      setConnectedEmail(nextConnected);
      setIsChangingEmail(false);
      const successMsg = copy.contactThreads.emailSyncSummary
        .replace('{fetched}', String(result.summary.fetchedMessages))
        .replace('{matched}', String(result.summary.matchedMessages))
        .replace('{updated}', String(result.summary.updatedContacts));
      setSyncAlert({ tone: 'success', message: successMsg });
      // Auto-dismiss success alert after 6 seconds
      if (alertDismissRef.current) clearTimeout(alertDismissRef.current);
      alertDismissRef.current = setTimeout(() => setSyncAlert(null), 6000);
    } catch (syncError) {
      setSummary(null);
      const friendlyError = toFriendlyEmailSyncError(
        copy,
        imapPresetId,
        syncError instanceof Error ? syncError.message : copy.contactThreads.emailSyncFailed,
      );
      setError(friendlyError);
      setSyncAlert({ tone: 'failure', message: friendlyError });
    } finally {
      setIsSyncing(false);
    }
  }

  const showConnectedState = Boolean(connectedEmail);
  const isConnectedLocked = showConnectedState && !isChangingEmail;
  const uiLocked = isSyncing || isConnectedLocked;
  const syncDisabled = isSyncing || isConnectedLocked;

  const syncDisabledReason = (() => {
    if (isSyncing) return null;
    if (contactsWithEmail.length === 0) return copy.contactThreads.emailSyncNeedContactEmail;
    return null;
  })();

  const panelContent = (
    <div className="space-y-2">
          <p className="text-[10px] leading-5 text-slate-500">{copy.contactThreads.emailSyncHint}</p>

          {showConnectedState ? (
            <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[12px] font-semibold text-emerald-700">
                    {copy.contactThreads.emailSyncConnectedAs.replace('{email}', connectedEmail?.username ?? '')}
                  </p>
                </div>
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-emerald-600" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6.5 10.5l2.2 2.2 4.8-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    setConfig({ ...DEFAULT_CONFIG, username: '', password: '' });
                    setImapPresetId('qq');
                    setIsChangingEmail(true);
                    setSyncAlert(null);
                  }}
                  disabled={isSyncing}
                >
                  {copy.contactThreads.emailSyncUseAnotherEmail}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#edd7e0] bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-[#e7aac2] hover:text-[#c15480] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleDisconnect}
                  disabled={isSyncing}
                >
                  {copy.contactThreads.emailSyncDisconnect}
                </button>
              </div>
            </div>
          ) : null}

          <EmailProviderPicker
            presets={IMAP_PRESETS}
            value={imapPresetId}
            onChange={setImapPresetId}
            disabled={uiLocked}
          />

          {/* Smart email input — three states: green ✓ match, amber ⚠ mismatch, red ✗ invalid */}
          <div className="space-y-1">
            <div className="relative">
              {(() => {
                const show = emailDirty || emailTouched;
                const valid = isEmailValid(config.username);
                const mismatch = valid ? getProviderMismatch(config.username, imapPresetId) : null;
                const borderClass = !show
                  ? 'border-[#edd7e0] focus:border-[#e7aac2]'
                  : mismatch
                    ? 'border-amber-400 focus:border-amber-500'
                    : valid
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : 'border-rose-400 focus:border-rose-500';
                return (
                  <>
                    <input
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      disabled={uiLocked}
                      value={config.username}
                      onChange={event => {
                        setConfig(prev => ({ ...prev, username: event.target.value }));
                        if (!emailDirty) setEmailDirty(true);
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder={copy.contactThreads.emailUsernamePlaceholder}
                      aria-invalid={show && (!valid || Boolean(mismatch))}
                      className={[
                        'w-full rounded-[10px] border bg-white py-2 pl-3 pr-9 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500',
                        borderClass,
                      ].join(' ')}
                    />
                    {show && (
                      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                        {mismatch ? (
                          /* Amber warning triangle */
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-amber-500" fill="none">
                            <path d="M10 3L2 17h16L10 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M10 9v3M10 13.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        ) : valid ? (
                          /* Green checkmark */
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-500" fill="none">
                            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          /* Red cross */
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-rose-500" fill="none">
                            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
            {/* Mismatch hint rendered below the input */}
            {(emailDirty || emailTouched) && isEmailValid(config.username) && getProviderMismatch(config.username, imapPresetId) ? (
              <p className="flex items-center gap-1 text-[10px] text-amber-700">
                <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-amber-500" fill="none">
                  <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M8 7v2.5M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {copy.contactThreads.emailSyncErrorProviderMismatch.replace('{provider}', String(getProviderMismatch(config.username, imapPresetId)))}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={uiLocked}
              value={config.password}
              onChange={event => setConfig(prev => ({ ...prev, password: event.target.value }))}
              placeholder={copy.contactThreads.emailPasswordPlaceholder}
              className="w-full rounded-[10px] border border-[#edd7e0] bg-white py-2 pl-3 pr-14 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
            <button
              type="button"
              aria-label={showPassword ? copy.contactThreads.emailHidePassword : copy.contactThreads.emailShowPassword}
              className="absolute inset-y-0 right-2 inline-flex items-center justify-center text-[10px] font-semibold text-[#b54e77] transition hover:text-[#c15480] disabled:opacity-50"
              onClick={() => setShowPassword(prev => !prev)}
              disabled={uiLocked}
            >
              {showPassword ? copy.contactThreads.emailHidePassword : copy.contactThreads.emailShowPassword}
            </button>
          </div>

          <p className="text-[10px] text-slate-500">{getEmailPasswordHint(copy, imapPresetId)}</p>

          <div className="relative rounded-[10px] border border-[#f0dbe3] bg-[#fffafb] px-3 py-2 pb-9">
            <p className="text-[10px] font-semibold text-slate-700">{copy.contactThreads.emailProviderHelpTitle}</p>
            <p className="mt-1 text-[10px] leading-5 text-slate-600">{getEmailProviderHelp(copy, imapPresetId)}</p>

            <button
              type="button"
              aria-label={copy.contactThreads.emailProviderHelpTitle}
              className="absolute bottom-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#edd7e0] bg-white text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
              onClick={() => {
                void handleCopyProviderHelp();
              }}
              disabled={uiLocked}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81] active:scale-[0.97] disabled:opacity-60"
            onClick={handleSync}
            disabled={syncDisabled}
          >
            {isSyncing
              ? copy.contactThreads.emailSyncRunning
              : isConnectedLocked
                    ? copy.contactThreads.emailSyncConnectedTitle
                    : copy.contactThreads.emailSyncAction}
          </button>

          {syncDisabledReason ? (
            <p className="text-[10px] text-amber-700">{syncDisabledReason}</p>
          ) : null}

          {syncAlert ? (
            <div
              role={syncAlert.tone === 'failure' ? 'alert' : 'status'}
              aria-live="polite"
              className={[
                'flex items-start gap-2 rounded-[10px] border px-3 py-2 text-[10px]',
                syncAlert.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              ].join(' ')}
            >
              {syncAlert.tone === 'success' ? (
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6.5 10.5l2.2 2.2 4.8-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M10 6.2v4.8M10 13.5v.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              <span className="flex-1 leading-4">{syncAlert.message}</span>
              <button
                type="button"
                aria-label={copy.contactThreads.autoSyncDismiss}
                className="text-[10px] font-semibold opacity-80 transition hover:opacity-100"
                onClick={() => setSyncAlert(null)}
              >
                {copy.contactThreads.autoSyncDismiss}
              </button>
            </div>
          ) : null}

          {isSyncing || summary ? (
            <div className="rounded-[10px] border border-[#f0dbe3] bg-[#fffafb] px-3 py-2">
              <p className="text-[10px] text-slate-600">
                {isSyncing
                  ? copy.contactThreads.emailSyncDiagnosticsRunning
                  : copy.contactThreads.emailSyncDiagnosticsSuccess
                      .replace('{fetched}', String(summary?.fetchedMessages ?? 0))
                      .replace('{matched}', String(summary?.matchedMessages ?? 0))
                      .replace('{updated}', String(summary?.updatedContacts ?? 0))}
              </p>
            </div>
          ) : null}
    </div>
  );

  if (embedded) {
    return panelContent;
  }

  return (
    <section className="rounded-[14px] border border-[#f0dbe3] bg-[#fffafb] px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-[11px] font-semibold text-[#b54e77] transition hover:text-[#c15480]"
          onClick={() => setIsOpen(prev => !prev)}
        >
          {copy.contactThreads.emailSyncTitle}
        </button>
        {summary ? (
          <span className="text-[10px] text-emerald-600">{copy.contactThreads.emailSyncReady}</span>
        ) : null}
      </div>

      {isOpen ? panelContent : null}
    </section>
  );
}
