import { useEffect, useId, useRef, useState } from 'react';
import type React from 'react';
import type { AppLanguage, AppTranslations } from '../../i18n/translations';
import LanguageRecommendationChip from '../cross-language/LanguageRecommendationChip';
import IntentChip from '../intent/IntentChip';
import type { DetectedIntent } from '../intent/detectIntent';

type WorkbenchHeaderProps = {
  copy: AppTranslations;
  compactMode: boolean;
  language: AppLanguage;
  isLanguageOpen: boolean;
  isTextTypeOpen: boolean;
  languageDropdownRef: React.RefObject<HTMLDivElement | null>;
  textTypeDropdownRef: React.RefObject<HTMLDivElement | null>;
  selectedTextTypeLabel: string;
  textType: string;
  textTypeOptions: AppTranslations['textTypes'];
  showActionButton?: boolean;
  actionCount?: number;
  actionLabel?: string;
  showRememberedContextButton?: boolean;
  rememberedContextCount?: number;
  rememberedContextHasPendingAction?: boolean;
  rememberedContextOpen?: boolean;
  rememberedContextLabel?: string;
  headerStatusLabel?: string | null;
  showHeaderStatus?: boolean;
  onToggleLanguageDropdown: () => void;
  onSelectLanguage: (value: AppLanguage) => void;
  onToggleTextTypeDropdown: () => void;
  onSelectTextType: (value: string) => void;
  onOpenActions?: () => void;
  onToggleRememberedContext?: () => void;
  onToggleMoreFeatures: () => void;
  /** Cross-language layer (Phase 3). Optional so existing tests/wirings keep working. */
  recommendedReplyLanguage?: 'en' | 'zh';
  showLanguageRecommendation?: boolean;
  onApplyLanguageRecommendation?: () => void;
  /** Intent chip (Phase 14). Hidden when null, suppressed, or when the
   *  language-recommendation chip is active (one calm header signal). */
  detectedIntent?: DetectedIntent | null;
  intentChipSuppressed?: boolean;
};

export default function WorkbenchHeader({
  copy,
  compactMode,
  language,
  isLanguageOpen,
  isTextTypeOpen,
  languageDropdownRef,
  textTypeDropdownRef,
  selectedTextTypeLabel,
  textType,
  textTypeOptions,
  showActionButton = false,
  actionCount = 0,
  actionLabel,
  showRememberedContextButton = false,
  rememberedContextCount = 0,
  rememberedContextHasPendingAction = false,
  rememberedContextOpen = false,
  rememberedContextLabel,
  headerStatusLabel = null,
  showHeaderStatus = false,
  onToggleLanguageDropdown,
  onSelectLanguage,
  onToggleTextTypeDropdown,
  onSelectTextType,
  onOpenActions,
  onToggleRememberedContext,
  onToggleMoreFeatures,
  recommendedReplyLanguage,
  showLanguageRecommendation = false,
  onApplyLanguageRecommendation,
  detectedIntent = null,
  intentChipSuppressed = false,
}: WorkbenchHeaderProps) {
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const textTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const textTypeOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const languageListboxId = useId();
  const textTypeListboxId = useId();
  const selectedLanguageIndex = Math.max(0, copy.languageOptions.findIndex(item => item.value === language));
  const selectedTextTypeIndex = Math.max(0, textTypeOptions.findIndex(type => type.id === textType));

  useEffect(() => {
    if (!isLanguageOpen) return;

    window.requestAnimationFrame(() => {
      languageOptionRefs.current[selectedLanguageIndex]?.focus();
    });
  }, [isLanguageOpen, selectedLanguageIndex]);

  useEffect(() => {
    if (!isTextTypeOpen) return;

    window.requestAnimationFrame(() => {
      textTypeOptionRefs.current[selectedTextTypeIndex]?.focus();
    });
  }, [isTextTypeOpen, selectedTextTypeIndex]);

  const moveLanguageFocus = (nextIndex: number) => {
    const boundedIndex = (nextIndex + copy.languageOptions.length) % copy.languageOptions.length;
    languageOptionRefs.current[boundedIndex]?.focus();
  };

  const moveTextTypeFocus = (nextIndex: number) => {
    const boundedIndex = (nextIndex + textTypeOptions.length) % textTypeOptions.length;
    textTypeOptionRefs.current[boundedIndex]?.focus();
  };

  // Keep the warning button mounted briefly after the last task is handled so it
  // can fade + shrink out instead of vanishing abruptly.
  const [actionMounted, setActionMounted] = useState(showActionButton);
  const [actionLeaving, setActionLeaving] = useState(false);
  useEffect(() => {
    if (showActionButton) {
      setActionMounted(true);
      setActionLeaving(false);
      return;
    }
    if (!actionMounted) return;
    setActionLeaving(true);
    const timer = window.setTimeout(() => {
      setActionMounted(false);
      setActionLeaving(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [showActionButton, actionMounted]);

  return (
    <div className={`flex items-center ${compactMode ? 'gap-1.5' : 'gap-2'}`} data-tour-anchor="cmd-k">
      <div className="relative shrink-0" ref={languageDropdownRef as React.Ref<HTMLDivElement>}>
        <button
          ref={languageTriggerRef}
          type="button"
          className={[
            'flex items-center gap-2 rounded-full border border-[#f4d7e1] bg-white font-medium text-slate-600',
            compactMode ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px]',
          ].join(' ')}
          aria-expanded={isLanguageOpen}
          aria-haspopup="listbox"
          aria-controls={languageListboxId}
          onClick={onToggleLanguageDropdown}
          onKeyDown={event => {
            if (!isLanguageOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onToggleLanguageDropdown();
            }
          }}
        >
          <span className="max-w-[72px] truncate">
            {copy.languageOptions.find(item => item.value === language)?.label ?? copy.languageOptions[0].label}
          </span>
          <span className={`text-[10px] text-[#E85C8B] transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`}>
            ˅
          </span>
        </button>

        {isLanguageOpen && (
          <div className="clean-scrollbar absolute left-0 top-[calc(100%+8px)] z-30 w-[140px] overflow-auto rounded-[14px] border border-[#f2dce4] bg-white p-1.5 shadow-[0_14px_35px_rgba(232,92,139,0.16)]">
            <ul id={languageListboxId} role="listbox" aria-label={copy.settings.defaultLanguageTitle} className="space-y-1">
              {copy.languageOptions.map((item, index) => (
                <li key={item.value}>
                  <button
                    ref={element => {
                      languageOptionRefs.current[index] = element;
                    }}
                    type="button"
                    role="option"
                    aria-selected={language === item.value}
                    className={[
                      'w-full rounded-[10px] px-3 py-2 text-left text-[11px] transition',
                      language === item.value ? 'bg-[#fde7ef] font-semibold text-[#E85C8B]' : 'text-slate-600 hover:bg-[#fff5f8]',
                    ].join(' ')}
                    onKeyDown={event => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveLanguageFocus(index + 1);
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveLanguageFocus(index - 1);
                      } else if (event.key === 'Home') {
                        event.preventDefault();
                        moveLanguageFocus(0);
                      } else if (event.key === 'End') {
                        event.preventDefault();
                        moveLanguageFocus(copy.languageOptions.length - 1);
                      }
                    }}
                    onClick={() => {
                      onSelectLanguage(item.value);
                      window.requestAnimationFrame(() => {
                        languageTriggerRef.current?.focus();
                      });
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {recommendedReplyLanguage ? (
        <LanguageRecommendationChip
          copy={copy}
          recommendedLanguage={recommendedReplyLanguage}
          visible={showLanguageRecommendation}
          onApply={() => onApplyLanguageRecommendation?.()}
          compactMode={compactMode}
        />
      ) : null}

      <IntentChip
        copy={copy}
        intent={detectedIntent}
        suppressed={intentChipSuppressed || showLanguageRecommendation}
        compactMode={compactMode}
      />

      <div
        className={[
          'flex min-h-[28px] min-w-0 flex-1 items-center justify-center px-1 transition-all duration-200',
          showHeaderStatus && headerStatusLabel ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        {headerStatusLabel ? (
          <p className="max-w-full truncate rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-center text-[9px] font-semibold leading-none text-emerald-700 shadow-[0_6px_14px_rgba(16,185,129,0.14)] ring-1 ring-emerald-100/80">
            {headerStatusLabel}
          </p>
        ) : null}
      </div>

      <div className={`flex shrink-0 items-center ${compactMode ? 'gap-2' : 'gap-2.5'}`}>
        {actionMounted || showRememberedContextButton ? (
          <div
            className={[
              'flex shrink-0 items-center',
              compactMode ? '-space-x-2.5' : '-space-x-2',
            ].join(' ')}
            aria-label="Workbench alerts"
          >
            {actionMounted ? (
              <button
                type="button"
                className={[
                  'group relative z-20 flex items-center justify-center rounded-full border border-amber-200 bg-[linear-gradient(135deg,#fff7dc,#ffffff_48%,#ffe6a3)] text-amber-700 shadow-[0_8px_20px_rgba(217,119,6,0.14)] transition-all duration-300 ease-out hover:z-30 hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-800',
                  compactMode ? 'h-8 w-8' : 'h-9 w-9',
                  actionLeaving ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100',
                ].join(' ')}
                aria-label={actionLabel ?? copy.floating.openActionCenter}
                title={actionLabel ?? copy.floating.openActionCenter}
                aria-hidden={actionLeaving}
                data-focus-plan-anchor=""
                onClick={onOpenActions}
              >
                <span className="absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.75)_45%,transparent_70%)] opacity-0 transition group-hover:opacity-100 motion-safe:animate-pulse" />
                <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M12 3.75 21 19.5H3L12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 9v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 16.75h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                {actionCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E85C8B] px-1 text-[8px] font-bold leading-none text-white">
                    {actionCount > 9 ? '9+' : actionCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {showRememberedContextButton ? (
              <button
                type="button"
                className={[
                  'group relative z-10 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out hover:z-30 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800',
                  rememberedContextOpen ? 'z-30 border-slate-300 text-slate-900 ring-2 ring-slate-200/80' : '',
                  compactMode ? 'h-8 w-8' : 'h-9 w-9',
                ].join(' ')}
                aria-label={rememberedContextLabel ?? copy.floating.memoryCueButtonAria}
                title={rememberedContextLabel ?? copy.floating.memoryCueButtonAria}
                aria-expanded={rememberedContextOpen}
                data-remembered-context-anchor=""
                onClick={onToggleRememberedContext}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={[
                    'h-4 w-4 transition-colors',
                    rememberedContextHasPendingAction ? 'remembered-bell-attention' : '',
                  ].join(' ')}
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {rememberedContextCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-slate-700 px-1 text-[8px] font-bold leading-none text-white">
                    {rememberedContextCount > 9 ? '9+' : rememberedContextCount}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="relative" ref={textTypeDropdownRef as React.Ref<HTMLDivElement>}>
          <button
            ref={textTypeTriggerRef}
            type="button"
            className={[
              'flex items-center gap-2 rounded-full border border-[#f4d7e1] bg-white font-medium text-slate-600',
              compactMode ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px]',
            ].join(' ')}
            aria-expanded={isTextTypeOpen}
            aria-haspopup="listbox"
            aria-controls={textTypeListboxId}
            onClick={onToggleTextTypeDropdown}
            onKeyDown={event => {
              if (!isTextTypeOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onToggleTextTypeDropdown();
              }
            }}
          >
            <span className="max-w-[110px] truncate">{selectedTextTypeLabel}</span>
            <span className={`text-[10px] text-[#E85C8B] transition-transform ${isTextTypeOpen ? 'rotate-180' : ''}`}>
              ˅
            </span>
          </button>

          {isTextTypeOpen && (
            <div className="clean-scrollbar absolute right-0 top-[calc(100%+8px)] z-30 w-[184px] overflow-auto rounded-[14px] border border-[#f2dce4] bg-white p-1.5 shadow-[0_14px_35px_rgba(232,92,139,0.16)]">
              <ul id={textTypeListboxId} role="listbox" aria-label={selectedTextTypeLabel} className="space-y-1">
                {textTypeOptions.map((type, index) => (
                  <li key={type.id}>
                    <button
                      ref={element => {
                        textTypeOptionRefs.current[index] = element;
                      }}
                      type="button"
                      role="option"
                      aria-selected={textType === type.id}
                      className={[
                        'w-full rounded-[10px] px-3 py-2 text-left text-[11px] transition',
                        textType === type.id ? 'bg-[#fde7ef] font-semibold text-[#E85C8B]' : 'text-slate-600 hover:bg-[#fff5f8]',
                      ].join(' ')}
                      onKeyDown={event => {
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          moveTextTypeFocus(index + 1);
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          moveTextTypeFocus(index - 1);
                        } else if (event.key === 'Home') {
                          event.preventDefault();
                          moveTextTypeFocus(0);
                        } else if (event.key === 'End') {
                          event.preventDefault();
                          moveTextTypeFocus(textTypeOptions.length - 1);
                        }
                      }}
                      onClick={() => {
                        onSelectTextType(type.id);
                        window.requestAnimationFrame(() => {
                          textTypeTriggerRef.current?.focus();
                        });
                      }}
                    >
                      {type.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          data-tour-anchor="add-contact"
          className={`relative z-30 shrink-0 leading-none text-[#f178a5] transition hover:text-[#E85C8B] ${compactMode ? 'text-[22px]' : 'text-[24px]'}`}
          aria-label={copy.floating.openMoreFeatures}
          onClick={onToggleMoreFeatures}
        >
          三
        </button>
      </div>
    </div>
  );
}
