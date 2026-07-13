import type { AppTranslations } from '../../i18n/translations';
import type { ImapPresetId } from './imapPresets';

export function getEmailProviderHelp(copy: AppTranslations, presetId: ImapPresetId): string {
  return copy.contactThreads.emailProviderHelpItems[presetId] || copy.contactThreads.emailProviderHelpGeneric;
}
