import { useMemo, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import { formatRelativeAge } from './command-center/formatRelativeAge';
import type { ProductAnnouncement } from '../config/productAnnouncements';
import type { AppTranslations } from '../i18n/translations';

type MessagesProps = {
  onClose: () => void;
  copy: AppTranslations;
  announcements: ProductAnnouncement[];
  readMessageIds: string[];
  onMarkRead: (id: string) => void;
  isLoading?: boolean;
};

export default function Messages({
  onClose,
  copy,
  announcements,
  readMessageIds,
  onMarkRead,
  isLoading = false,
}: MessagesProps) {
  const readSet = useMemo(() => new Set(readMessageIds), [readMessageIds]);
  const [focusedId, setFocusedId] = useState<string | null>(announcements[0]?.id ?? null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const handleOpenMessage = (messageId: string) => {
    onMarkRead(messageId);
    setActiveMessageId(messageId);
  };

  const activeMessage = announcements.find(message => message.id === activeMessageId) ?? null;

  return (
    <MiniScreenFrame
      label={copy.messages.frameLabel}
      title={copy.messages.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
    >
        <div className="relative h-full">
        <div className="clean-scrollbar h-full overflow-y-auto px-5 pt-5 pb-7">
          <p className="mb-2 text-[10px] leading-snug text-slate-500">{copy.messages.companionNote}</p>
          {announcements.length > 0 && (
            <div className="mb-3 rounded-[12px] border border-[#f1d7e1] bg-[#fff6fa] px-3 py-2 text-[10px] text-[#9e5b77]">
              {copy.messages.focusHint}
            </div>
          )}

          {isLoading && announcements.length === 0 ? (
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-8 text-center">
              <p className="text-[12px] text-slate-500">{copy.messages.loading}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#edd7e0] bg-[#fffafb] px-4 py-8 text-center">
              <p className="text-[13px] font-semibold text-slate-800">{copy.messages.emptyTitle}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{copy.messages.emptyBody}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(message => {
                const isFocused = focusedId === message.id;
                const isRead = readSet.has(message.id);
                const timeLabel = formatRelativeAge(message.publishedAt, copy.floating);

                return (
                  <article
                    key={message.id}
                    data-message-id={message.id}
                    onMouseEnter={() => setFocusedId(message.id)}
                    onFocusCapture={() => setFocusedId(message.id)}
                    className={[
                      'rounded-[16px] border bg-white px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200',
                      isFocused
                        ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                        : 'border-slate-200',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={[
                                'inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                                isRead ? 'bg-[#f6f0f3] text-[#a37b8c]' : 'bg-[#ffe7f0] text-[#d55283]',
                              ].join(' ')}
                            >
                              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                                <rect x="3.5" y="5" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                <path d="m6.5 8.5l5.5 4l5.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <p className="text-[12px] font-semibold text-slate-900">{message.title}</p>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-[10px] text-slate-400">{timeLabel}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={[
                            'text-[10px] font-medium',
                            isRead ? 'text-slate-400' : 'text-[#d55283]',
                          ].join(' ')}
                        >
                          {isRead ? copy.messages.read : copy.messages.unread}
                        </span>
                        <button
                          type="button"
                          className={[
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
                            isFocused
                              ? 'border-[#e8b1c6] bg-[#fdeaf1] text-[#bc557d]'
                              : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2] hover:text-[#c15480]',
                          ].join(' ')}
                          onClick={() => handleOpenMessage(message.id)}
                          aria-label={copy.messages.show}
                        >
                          {copy.messages.show}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {activeMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0f172a]/35 px-3 backdrop-blur-[1px]">
            <section className="animate-fade-in w-full rounded-[18px] border border-[#f0cadb] bg-white px-4 pt-4 pb-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">{copy.messages.frameLabel}</p>
                  <p className="mt-1 text-[14px] font-semibold leading-5 text-slate-900">{activeMessage.title}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#e8b1c6] bg-[#fdeaf1] px-3 py-1 text-[10px] font-semibold text-[#bc557d] transition hover:bg-[#f8dce8]"
                  onClick={() => setActiveMessageId(null)}
                  aria-label={copy.messages.hide}
                >
                  {copy.messages.hide}
                </button>
              </div>

              <p className="mt-3 text-[10px] text-slate-400">
                {formatRelativeAge(activeMessage.publishedAt, copy.floating)}
              </p>

              <div className="mt-3 rounded-[14px] border border-[#f4d7e1] bg-[#fff8fb] px-3.5 py-3.5">
                <p className="text-[12px] leading-6 text-slate-700">{activeMessage.body}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </MiniScreenFrame>
  );
}
