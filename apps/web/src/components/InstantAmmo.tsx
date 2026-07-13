import React from 'react';
import type { RecipientProfile, WorkMode } from './workbench/types';
import { SCENARIO_REGISTRY } from './scenarios/scenarioRegistry';

export type AmmoScenario = {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
  recipient: RecipientProfile;
  textType: string;
  workMode: WorkMode;
};

type Props = {
  title: string;
  scenarioLabels: Record<string, { label: string; prompt: string }>;
  prioritizedIds?: string[];
  onSelect: (scenario: AmmoScenario) => void;
  disabled?: boolean;
};

export default function InstantAmmo({ title, scenarioLabels, prioritizedIds, onSelect, disabled }: Props) {
  const orderedStatic = prioritizedIds?.length
    ? [
      ...prioritizedIds
        .map(id => SCENARIO_REGISTRY.find(scenario => scenario.id === id))
        .filter((scenario): scenario is typeof SCENARIO_REGISTRY[number] => Boolean(scenario)),
      ...SCENARIO_REGISTRY.filter(scenario => !prioritizedIds.includes(scenario.id)),
    ]
    : SCENARIO_REGISTRY;

  const merged: AmmoScenario[] = orderedStatic.map(s => ({
    ...s,
    label: scenarioLabels[s.id]?.label ?? s.id,
    prompt: scenarioLabels[s.id]?.prompt ?? '',
  }));

  return (
    <div className="mb-2" data-tour-anchor="quick-start">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#b85a82]">
        {title}
      </p>
      <div className="-mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-1.5 whitespace-nowrap py-0.5">
          {merged.map(scenario => (
            <button
              key={scenario.id}
              type="button"
              disabled={disabled}
              className={[
                'flex shrink-0 items-center gap-1 rounded-full border border-[#f4d7e1] bg-[#fff7fa] px-2.5 py-1 text-[10px] font-medium text-[#8f4e69]',
                'transition hover:border-[#e7aac2] hover:bg-[#fde7ef] active:scale-95',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
              onClick={() => !disabled && onSelect(scenario)}
            >
              <span aria-hidden="true">{scenario.emoji}</span>
              <span>{scenario.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
