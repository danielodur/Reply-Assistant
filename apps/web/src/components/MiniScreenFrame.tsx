import type { CSSProperties, ReactNode } from 'react';

type MiniScreenFrameProps = {
  label: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  backLabel: string;
  contentClassName?: string;
  containerClassName?: string;
  headerAccessory?: ReactNode;
  contentOverlay?: ReactNode;
  contentScrollable?: boolean;
};

export default function MiniScreenFrame({
  label,
  title,
  onClose,
  children,
  backLabel,
  contentClassName = '',
  containerClassName = '',
  headerAccessory,
  contentOverlay,
  contentScrollable = true,
}: MiniScreenFrameProps) {
  const isDetachedWindow = Boolean(window.desktopApp?.isChildWindow);

  return (
    <section
      className={[
        isDetachedWindow
          ? 'relative z-40 h-full w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]'
          : 'relative z-40 h-[min(586px,calc(100vh-64px))] w-[min(520px,calc(100vw-32px))] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]',
        containerClassName,
      ].join(' ').trim()}
    >
      <div
        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-200 px-5 py-4"
        style={isDetachedWindow ? ({ WebkitAppRegion: 'drag' } as CSSProperties) : undefined}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d86a94]">{label}</p>
          <h2 className="mt-1 text-[18px] font-semibold leading-tight text-slate-900">{title}</h2>
        </div>
        {headerAccessory ? (
          <div
            className="justify-self-center"
            style={isDetachedWindow ? ({ WebkitAppRegion: 'no-drag' } as CSSProperties) : undefined}
          >
            {headerAccessory}
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f2d6e0] bg-white text-slate-500 transition hover:border-[#e7aac2] hover:bg-[#fff5f9] hover:text-[#d86a94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
          aria-label={backLabel}
          title={backLabel}
          style={isDetachedWindow ? ({ WebkitAppRegion: 'no-drag' } as CSSProperties) : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        className={[
          'h-[calc(100%-74px)]',
          contentScrollable ? 'clean-scrollbar overflow-y-auto' : 'overflow-hidden',
          contentClassName,
        ].join(' ').trim()}
      >
        {children}
      </div>

      {contentOverlay ? (
        <div className="absolute inset-x-0 bottom-0 top-[74px] z-50">{contentOverlay}</div>
      ) : null}
    </section>
  );
}
