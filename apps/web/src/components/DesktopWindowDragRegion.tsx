import type { CSSProperties } from 'react';

export function isDesktopMainWindow(): boolean {
  return Boolean(
    typeof window !== 'undefined'
      && window.desktopApp?.isElectron
      && !window.desktopApp?.isChildWindow,
  );
}

export function desktopDragStyle(): CSSProperties | undefined {
  return isDesktopMainWindow() ? { WebkitAppRegion: 'drag' } : undefined;
}

export function desktopNoDragStyle(): CSSProperties | undefined {
  return isDesktopMainWindow() ? { WebkitAppRegion: 'no-drag' } : undefined;
}

type DesktopWindowDragRegionProps = {
  className?: string;
};

export default function DesktopWindowDragRegion({ className = '' }: DesktopWindowDragRegionProps) {
  if (!isDesktopMainWindow()) return null;

  return (
    <div
      className={`pointer-events-auto absolute left-0 top-0 h-10 ${className}`.trim()}
      style={desktopDragStyle()}
    />
  );
}
