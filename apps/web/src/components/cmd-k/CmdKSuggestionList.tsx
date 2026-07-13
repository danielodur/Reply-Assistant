import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import type { SmartSuggestion } from '../smart-suggestions/types';

type CmdKSuggestionListProps = {
  suggestions: SmartSuggestion[];
  copy: AppTranslations;
  onSelect: (suggestion: SmartSuggestion) => void;
};

function suggestionLabel(suggestion: SmartSuggestion, copy: AppTranslations): string {
  switch (suggestion.kind) {
    case 'reply-contact':
      return interpolate(copy.floating.cmdKSuggestReply, { name: suggestion.contactName ?? '' });
    case 'follow-up-contact':
      return interpolate(copy.floating.cmdKSuggestFollowUp, { name: suggestion.contactName ?? '' });
    case 'resume-contact':
      return interpolate(copy.floating.cmdKSuggestResume, { name: suggestion.contactName ?? '' });
    case 'paste-message':
      return copy.floating.cmdKSuggestPaste;
    case 'add-contact':
      return copy.floating.addContact;
    case 'quick-scenario':
      if (suggestion.scenarioId && copy.instantAmmo.scenarios[suggestion.scenarioId]) {
        return copy.instantAmmo.scenarios[suggestion.scenarioId].label;
      }
      return copy.floating.cmdKSuggestPaste;
    default:
      return copy.floating.cmdKSuggestPaste;
  }
}

export default function CmdKSuggestionList({ suggestions, copy, onSelect }: CmdKSuggestionListProps) {
  if (!suggestions.length) return null;

  return (
    <div className="mb-2">
      <p className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b85a82]">
        {copy.floating.cmdKForYouLabel}
      </p>
      <div className="space-y-1">
        {suggestions.map(suggestion => (
          <button
            key={suggestion.id}
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-[12px] px-2.5 py-2 text-left transition hover:bg-[#fff7fa]"
            onClick={() => onSelect(suggestion)}
          >
            <span className="truncate text-[12px] font-medium text-[#2f2926]">
              {suggestionLabel(suggestion, copy)}
            </span>
            <span className="shrink-0 text-[9px] text-slate-400">↵</span>
          </button>
        ))}
      </div>
    </div>
  );
}
