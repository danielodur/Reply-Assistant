import type { AppTranslations } from '../../i18n/translations';
import type { ContactThread } from '../../config/contactThreads';
import { deriveRelationshipStats } from './deriveRelationshipStats';
import { formatRelationshipHint } from './formatRelationshipHint';

type RelationshipHintLineProps = {
  thread: ContactThread;
  copy: AppTranslations;
};

/**
 * Phase 15 — Dynamic Relationship Memory hint line.
 *
 * Renders one calm sentence under the contact card meta when at least one
 * derived stat passes its sample-size threshold. Returns `null` (and the
 * card shows nothing) when the thread is too quiet to make an honest claim.
 *
 * Visual: 10px slate text, same tone as the existing activity/reason rows
 * above it — should disappear into the card.
 */
export default function RelationshipHintLine({ thread, copy }: RelationshipHintLineProps) {
  const stats = deriveRelationshipStats(thread.messages);
  const hint = formatRelationshipHint(stats, copy.relationshipMemory);
  if (!hint) return null;

  return (
    <p
      className="mt-1 text-[10px] text-slate-500"
      data-relationship-hint="true"
    >
      <span className="font-semibold text-slate-700">{copy.relationshipMemory.eyebrow}:</span>{' '}
      {hint}
    </p>
  );
}
