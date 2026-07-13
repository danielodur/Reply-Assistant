import InstantAmmo, { type AmmoScenario } from '../InstantAmmo';
import type { AppTranslations } from '../../i18n/translations';
import { getPrioritizedScenarioIds } from './buildSmartSuggestions';
import type { SmartSuggestion } from './types';

type ContextualQuickStartProps = {
  title: string;
  scenarioLabels: AppTranslations['instantAmmo']['scenarios'];
  suggestions: SmartSuggestion[];
  onSelect: (scenario: AmmoScenario) => void;
  disabled?: boolean;
};

export default function ContextualQuickStart({
  title,
  scenarioLabels,
  suggestions,
  onSelect,
  disabled,
}: ContextualQuickStartProps) {
  const prioritizedIds = getPrioritizedScenarioIds(suggestions);

  return (
    <InstantAmmo
      title={title}
      scenarioLabels={scenarioLabels}
      prioritizedIds={prioritizedIds}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
