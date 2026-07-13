import type { AppTranslations } from '../../i18n/translations';
import { normalizeSyncServer, type SyncServer } from './syncServerMeta';

export type SyncServerGuide = {
  title: string;
  steps: string[];
  continueLabel: string;
};

export function getSyncServerGuide(copy: AppTranslations, server: SyncServer): SyncServerGuide {
  const safeServer = normalizeSyncServer(server);
  const candidate = copy.contactThreads.syncGuides[safeServer];
  if (candidate && Array.isArray(candidate.steps)) {
    return candidate;
  }

  return {
    title: 'How to connect',
    continueLabel: 'Continue',
    steps: [
      '1. Open the sync panel.',
      '2. Fill in the required connection fields.',
      '3. Press sync to continue.',
    ],
  };
}
