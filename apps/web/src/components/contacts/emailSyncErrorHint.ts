import type { AppTranslations } from '../../i18n/translations';
import type { ImapPresetId } from './imapPresets';

function isAppPasswordProvider(presetId: ImapPresetId): boolean {
  return presetId === 'gmail' || presetId === 'outlook' || presetId === 'icloud' || presetId === 'yahoo' || presetId === 'aol';
}

function isChinaCodeProvider(presetId: ImapPresetId): boolean {
  return presetId === 'qq' || presetId === '163' || presetId === '126' || presetId === 'sina' || presetId === 'sohu';
}

export function getEmailPasswordHint(copy: AppTranslations, presetId: ImapPresetId): string {
  if (isChinaCodeProvider(presetId)) {
    return copy.contactThreads.emailSyncPasswordHintChinaCode;
  }

  if (isAppPasswordProvider(presetId)) {
    return copy.contactThreads.emailSyncPasswordHintAppPassword;
  }

  return copy.contactThreads.emailSyncPasswordHintGeneric;
}

export function toFriendlyEmailSyncError(copy: AppTranslations, presetId: ImapPresetId, rawError: string): string {
  const message = String(rawError || '').toLowerCase();

  if (!message.trim()) {
    return copy.contactThreads.emailSyncErrorGeneric;
  }

  if (message.includes('no contacts with email')) {
    return copy.contactThreads.emailSyncNeedContactEmail;
  }

  if (message.includes('missing email username')) {
    return copy.contactThreads.emailSyncErrorAddressMissing;
  }

  if (message.includes('missing email password')) {
    return copy.contactThreads.emailSyncErrorCodeMissing;
  }

  if (
    message.includes('auth')
    || message.includes('login failed')
    || message.includes('invalid credentials')
    || message.includes('authentication')
    || message.includes('authorization')
  ) {
    const providerHint = getEmailPasswordHint(copy, presetId);
    return `${copy.contactThreads.emailSyncErrorAuth} ${providerHint}`.trim();
  }

  if (
    message.includes('enotfound')
    || message.includes('econnrefused')
    || message.includes('getaddrinfo')
    || message.includes('host')
    || message.includes('server')
  ) {
    return copy.contactThreads.emailSyncErrorServer;
  }

  if (
    message.includes('timeout')
    || message.includes('timed out')
    || message.includes('etimedout')
    || message.includes('abort')
  ) {
    return copy.contactThreads.emailSyncErrorTimeout;
  }

  return copy.contactThreads.emailSyncErrorGeneric;
}
