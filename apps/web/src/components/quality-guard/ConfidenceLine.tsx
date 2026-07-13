import type { AppTranslations } from '../../i18n/translations';
import type { ConfidenceVerdict } from './buildConfidenceVerdict';

type ConfidenceLineProps = {
  copy: AppTranslations;
  verdict: ConfidenceVerdict;
  className?: string;
};

const SENTENCE_KEY: Record<ConfidenceVerdict['key'], keyof AppTranslations['modal']> = {
  ready: 'subtitle',
  'ready-voice': 'confidenceReadyVoice',
  review: 'confidenceReview',
  'voice-off': 'confidenceVoiceOff',
  thin: 'confidenceThin',
};

const DOT_CLASS: Record<ConfidenceVerdict['tone'], string> = {
  ready: 'bg-emerald-500',
  caution: 'bg-amber-500',
  neutral: 'bg-slate-400',
};

/**
 * Calm one-line confidence cue shown in the generated-reply header slot. It is
 * the single, plain-language lead — the detailed impression / voice / "why"
 * surfaces stay available below for anyone who wants them.
 */
export default function ConfidenceLine({ copy, verdict, className = '' }: ConfidenceLineProps) {
  const sentence = copy.modal[SENTENCE_KEY[verdict.key]];

  return (
    <p className={['mt-1 flex items-center gap-1.5 text-[11px] text-slate-500', className].filter(Boolean).join(' ')}>
      <span
        className={['inline-block h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[verdict.tone]].join(' ')}
        aria-hidden="true"
      />
      <span className="min-w-0">{sentence}</span>
    </p>
  );
}
