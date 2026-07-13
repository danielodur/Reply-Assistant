import { useEffect, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import type { AppTranslations } from '../i18n/translations';
import NoAppDataGuide from './guidance/NoAppDataGuide';
import type { MiniScreenId } from './workbench/types';

type ReplyHistoryItem = {
  id: string;
  preview: string;
  variant: 'short' | 'balanced' | 'persuasive';
  mode: 'reply' | 'internal';
  recipient: string;
  createdAt: number;
};

type RecentRepliesProps = {
  onClose: () => void;
  replies: ReplyHistoryItem[];
  onUse: (value: string) => void;
  copy: AppTranslations;
  foundationEmpty?: boolean;
  onOpenScreen?: (screenId: MiniScreenId) => void;
};

const formatRelativeTime = (createdAt: number, copy: AppTranslations) => {
  const minutesAgo = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (minutesAgo < 60) {
    return `${minutesAgo}${copy.recentReplies.minutesAgo}`;
  }
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo}${copy.recentReplies.hoursAgo}`;
  }
  return `${Math.floor(hoursAgo / 24)}${copy.recentReplies.daysAgo}`;
};

export default function RecentReplies({
  onClose,
  replies,
  onUse,
  copy,
  foundationEmpty = false,
  onOpenScreen,
}: RecentRepliesProps) {
  const [search, setSearch] = useState('');
  const [focusedReplyId, setFocusedReplyId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const filteredReplies = search.trim()
    ? replies.filter(r => r.preview.toLowerCase().includes(search.toLowerCase()))
    : replies;
  const activeReply = replies.find(reply => reply.id === activeReplyId) ?? null;

  useEffect(() => {
    if (!activeReplyId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveReplyId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activeReplyId]);

  return (
    <MiniScreenFrame
      label={copy.recentReplies.frameLabel}
      title={copy.recentReplies.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd] px-4 pt-4 pb-6"
      contentOverlay={activeReply ? (
        <div className="absolute inset-0 flex items-start justify-center bg-[#0f172a]/30 px-3 pt-5 pb-3 backdrop-blur-[3px] sm:px-4">
          <section className="animate-fade-in flex max-h-full w-full max-w-[430px] min-w-0 flex-col rounded-[18px] border border-[#f0cadb] bg-white px-4 pt-4 pb-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">{copy.recentReplies.frameLabel}</p>
                <p className="mt-1 text-[14px] font-semibold leading-5 text-slate-900">
                  {copy.recentReplies.modeLabels[activeReply.mode]} | {copy.recentReplies.variantLabels[activeReply.variant]}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e8b1c6] bg-[#fdeaf1] px-3 py-1 text-[10px] font-semibold text-[#bc557d] transition hover:bg-[#f8dce8]"
                onClick={() => setActiveReplyId(null)}
                aria-label={copy.messages.hide}
              >
                {copy.messages.hide}
              </button>
            </div>

            <p className="mt-3 text-[10px] text-slate-400">{formatRelativeTime(activeReply.createdAt, copy)}</p>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-[#f4d7e1] bg-[#fff8fb] px-3.5 py-3.5 clean-scrollbar">
              <p className="whitespace-pre-wrap break-words text-[12px] leading-6 text-slate-700">{activeReply.preview}</p>
            </div>
          </section>
        </div>
      ) : null}
    >
      {replies.length === 0 ? (
        foundationEmpty && onOpenScreen ? (
          <NoAppDataGuide copy={copy} onOpenScreen={onOpenScreen} />
        ) : (
          <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="text-[11px] text-slate-500">{copy.recentReplies.emptyText}</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={copy.recentReplies.searchPlaceholder}
              className="w-full rounded-[10px] border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#e7aac2]"
            />
          </div>

          {filteredReplies.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-[11px] text-slate-500">
              {copy.recentReplies.noResults}
            </p>
          ) : (
            filteredReplies.map(reply => {
              const isFocused = focusedReplyId === reply.id;
              return (
              <article
                key={reply.id}
                onMouseEnter={() => setFocusedReplyId(reply.id)}
                onMouseLeave={() => setFocusedReplyId(null)}
                className={[
                  'rounded-[16px] border bg-white px-4 py-3 transition-all duration-200',
                  isFocused
                    ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">
                    {copy.recentReplies.modeLabels[reply.mode]} | {copy.recentReplies.variantLabels[reply.variant]}
                  </p>
                  <span className="text-[10px] text-slate-400">{formatRelativeTime(reply.createdAt, copy)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-600">{reply.preview}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#f0dbe3] bg-[#fff5f9] px-3 py-1.5 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2]"
                    onClick={() => onUse(reply.preview)}
                  >
                    {copy.recentReplies.reuseInInput}
                  </button>
                  <div>
                    {reply.preview.length > 120 ? (
                      <button
                        type="button"
                        className="rounded-full border border-[#edd7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                        onClick={() => setActiveReplyId(reply.id)}
                      >
                        View All
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
            })
          )}
        </div>
      )}
    </MiniScreenFrame>
  );
}
