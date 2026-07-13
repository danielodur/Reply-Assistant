import { useRef, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import AssistedNotesTextarea from './AssistedNotesTextarea';
import type { BusinessContext, BusinessContextKey } from '../config/businessContext';
import type { AppTranslations } from '../i18n/translations';
import CompactUploadRow from './uploads/CompactUploadRow';
import { useBusinessUploads } from '../uploads/useBusinessUploads';
import { PROFILE_UPLOAD_LIMIT } from '../uploads/uploadValidation';

type BusinessContextScreenProps = {
  onClose: () => void;
  context: BusinessContext;
  onSetField: (key: BusinessContextKey, value: string) => void;
  copy: AppTranslations;
};

type FieldConfig = {
  key: BusinessContextKey;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

export default function BusinessContextScreen({ onClose, context, onSetField, copy }: BusinessContextScreenProps) {
  const bc = copy.businessContext;
  const businessUploads = useBusinessUploads();

  const fields: FieldConfig[] = [
    { key: 'yourName', label: bc.yourNameLabel, placeholder: bc.yourNamePlaceholder },
    { key: 'companyName', label: bc.companyNameLabel, placeholder: bc.companyNamePlaceholder },
    { key: 'yourPosition', label: bc.yourPositionLabel, placeholder: bc.yourPositionPlaceholder },
    { key: 'industry', label: bc.industryLabel, placeholder: bc.industryPlaceholder },
    { key: 'productsServices', label: bc.productsServicesLabel, placeholder: bc.productsServicesPlaceholder, multiline: true },
    { key: 'brandVoice', label: bc.brandVoiceLabel, placeholder: bc.brandVoicePlaceholder, multiline: true },
    { key: 'commonObjections', label: bc.commonObjectionsLabel, placeholder: bc.commonObjectionsPlaceholder, multiline: true },
    { key: 'doNotSay', label: bc.doNotSayLabel, placeholder: bc.doNotSayPlaceholder, multiline: true },
  ];

  const [focusedKey, setFocusedKey] = useState<BusinessContextKey | null>(fields[0]?.key ?? null);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const canSubmitDraft = draftValue.trim().length > 0;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenEdit = (field: FieldConfig) => {
    setDraftValue(context[field.key]);
    setEditingField(field);
    setTimeout(() => {
      if (field.multiline) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 60);
  };

  const handleDone = () => {
    if (!canSubmitDraft) {
      return;
    }

    if (editingField) {
      onSetField(editingField.key, draftValue.trim());
    }
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  return (
    <MiniScreenFrame
      label={bc.frameLabel}
      title={bc.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
    >
      <div className="relative h-full">
        <div className="clean-scrollbar h-full overflow-y-auto px-5 pt-5 pb-7">
          {/* Hint banner */}
          <div className="mb-4 rounded-[12px] border border-[#f1d7e1] bg-[#fff6fa] px-3 py-2 text-[10px] text-[#9e5b77]">
            {bc.editHint}
          </div>

          <div className="mb-4">
            <CompactUploadRow
              title={bc.companyFilesTitle}
              hint={bc.companyFilesHint}
              attachLabel={copy.floating.attachFiles}
              limitReachedLabel={copy.floating.uploadLimitReached}
              removalDialogCopy={{
                title: copy.floating.removeLastLearningFileTitle,
                body: copy.floating.removeLastLearningFileBody,
                confirm: copy.floating.removeLastLearningFileConfirm,
                keep: copy.floating.removeLastLearningFileKeep,
                remove: copy.floating.removeLastLearningFileAction,
                cancel: copy.settings.cancel,
              }}
              uploads={businessUploads.uploads}
              maxFiles={PROFILE_UPLOAD_LIMIT}
              processing={businessUploads.processing}
              error={businessUploads.error}
              onAttach={files => void businessUploads.attachFiles(files)}
              onRemove={businessUploads.removeUpload}
            />
          </div>

          <div className="space-y-3">
            {fields.map(field => {
              const isFocused = focusedKey === field.key;
              const value = context[field.key];
              const isEmpty = !value;

              return (
                <article
                  key={field.key}
                  data-field-key={field.key}
                  onMouseEnter={() => setFocusedKey(field.key)}
                  onFocusCapture={() => setFocusedKey(field.key)}
                  className={[
                    'rounded-[16px] border bg-white px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200',
                    isFocused
                      ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                      : 'border-slate-200',
                  ].join(' ')}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p
                      className={[
                        'text-[10px] font-semibold uppercase tracking-[0.1em]',
                        isFocused ? 'text-[#bc557d]' : 'text-slate-400',
                      ].join(' ')}
                    >
                      {field.label}
                    </p>

                    {/* Pencil button */}
                    <button
                      type="button"
                      aria-label={`Edit ${field.label}`}
                      onClick={() => handleOpenEdit(field)}
                      className={[
                        'flex-shrink-0 rounded-full p-1.5 transition',
                        isFocused
                          ? 'bg-[#fdeaf1] text-[#bc557d] hover:bg-[#f8dce8]'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                      ].join(' ')}
                    >
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path
                          d="M14.846 2.654a1.875 1.875 0 112.652 2.652L6.373 16.432l-3.75.937.938-3.75L14.846 2.654z"
                          stroke="currentColor"
                          strokeWidth="1.55"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <p
                    className={[
                      'text-[12.5px] leading-[1.55] break-words',
                      isEmpty ? 'text-slate-400' : 'text-slate-800',
                    ].join(' ')}
                  >
                    {isEmpty ? field.placeholder : value}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Edit modal — same overlay pattern as Messages popup */}
        {editingField && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0f172a]/35 px-3 backdrop-blur-[1px]">
            <section className="animate-fade-in w-full rounded-[20px] border border-[#f0cadb] bg-white px-4 pt-4 pb-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
              {/* Modal header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">
                    {bc.frameLabel}
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-5 text-slate-900">
                    {editingField.label}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 rounded-full border border-[#e8dde5] bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100"
                  onClick={handleCancel}
                >
                  {bc.cancel}
                </button>
              </div>

              {/* Input area */}
              <div className="rounded-[14px] border border-[#f0e4ea] bg-[#fff8fb] px-3.5 py-3.5">
                {editingField.multiline ? (
                  <AssistedNotesTextarea
                    value={draftValue}
                    onChange={setDraftValue}
                    placeholder={editingField.placeholder}
                    textareaRef={textareaRef}
                    rows={6}
                    assistBankKey="business-context"
                    ghostMirrorClassName="text-[13px] leading-[1.65]"
                    textareaClassName="clean-scrollbar w-full resize-none bg-transparent text-[13px] leading-[1.65] text-slate-800 outline-none placeholder:text-slate-400"
                  />
                ) : (
                  <>
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder={editingField.placeholder}
                      value={draftValue}
                      onChange={e => setDraftValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && canSubmitDraft && !e.defaultPrevented) handleDone();
                        if (e.key === 'Escape' && !e.defaultPrevented) handleCancel();
                      }}
                    />
                  </>
                )}
              </div>

              {/* Done button */}
              <button
                type="button"
                className="mt-3.5 w-full rounded-[13px] bg-[#e8558a] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(232,85,138,0.28)] transition hover:bg-[#d44d80] active:scale-[0.98] disabled:cursor-not-allowed disabled:blur-[0.5px] disabled:bg-[#f0b8cc] disabled:text-white/80 disabled:shadow-none disabled:hover:bg-[#f0b8cc] disabled:active:scale-100"
                onClick={handleDone}
                disabled={!canSubmitDraft}
              >
                {bc.done}
              </button>
            </section>
          </div>
        )}
      </div>
    </MiniScreenFrame>
  );
}
