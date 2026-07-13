import type { AppTranslations } from '../../i18n/translations';
import type { DetectedIntent, DetectedIntentId } from './detectIntent';

type IntentChipProps = {
  copy: AppTranslations;
  intent: DetectedIntent | null;
  /**
   * True when something heavier owns the user's attention — modal, ring,
   * tour, match-confirm, language-recommendation chip. Honors the
   * one-calm-nudge invariant.
   */
  suppressed: boolean;
  compactMode?: boolean;
};

const INTENT_LABEL_KEY: Record<DetectedIntentId, keyof AppTranslations['intent']> = {
  request: 'request',
  approval: 'approval',
  negotiation: 'negotiation',
  followUp: 'followUp',
  escalation: 'escalation',
  apology: 'apology',
  scheduling: 'scheduling',
  feedback: 'feedback',
  statusUpdate: 'statusUpdate',
  reminder: 'reminder',
};

/**
 * Phase 14 — calm intent chip in the WorkbenchHeader.
 *
 * Visual: same height/border weight as the language recommendation chip so
 * the header doesn't feel busier than before. Single short row, no icon.
 * Returns `null` when there is no detected intent or when suppressed.
 */
export default function IntentChip({
  copy,
  intent,
  suppressed,
  compactMode = false,
}: IntentChipProps) {
  if (suppressed || !intent) return null;
  const intentCopy = copy.intent;
  const label = intentCopy[INTENT_LABEL_KEY[intent.id]];
  const urgencyLabel =
    intent.urgency === 'high'
      ? intentCopy.urgencyHigh
      : intent.urgency === 'medium'
        ? intentCopy.urgencyMedium
        : null;

  return (
    <div
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 font-medium text-sky-700',
        compactMode ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]',
      ].join(' ')}
      data-intent-chip={intent.id}
      title={`${intentCopy.eyebrow}: ${label}${urgencyLabel ? `${intentCopy.separator}${urgencyLabel}` : ''}`}
    >
      <span className="font-semibold uppercase tracking-[0.04em] text-sky-500 text-[9px]">
        {intentCopy.eyebrow}
      </span>
      <span>{label}</span>
      {urgencyLabel ? (
        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
          {urgencyLabel}
        </span>
      ) : null}
    </div>
  );
}
