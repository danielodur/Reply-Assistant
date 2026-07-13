import { screen } from 'electron';

export type ChildScreenId =
  | 'today-queue'
  | 'action-inbox'
  | 'contact-threads'
  | 'settings'
  | 'customer-service'
  | 'refer-friends'
  | 'messages'
  | 'recent-replies'
  | 'snippet-library'
  | 'reset-data'
  | 'business-context'
  | 'weekly-recap'
  | 'generated-reply';

export const CHILD_SCREEN_IDS = new Set<ChildScreenId>([
  'today-queue',
  'action-inbox',
  'contact-threads',
  'settings',
  'customer-service',
  'refer-friends',
  'messages',
  'recent-replies',
  'snippet-library',
  'reset-data',
  'business-context',
  'weekly-recap',
  'generated-reply',
]);

export const CHILD_WINDOW_SMALL = { width: 520, height: 586 } as const;
export const CHILD_WINDOW_COMPACT = { width: 392, height: 448 } as const;
export const CHILD_WINDOW_GENERATED = { width: 440, height: 640 } as const;
export const CHILD_WINDOW_MARGIN = 12;
export const CHILD_WINDOW_GAP = 8;
export const CHILD_WINDOW_TOP_OFFSET = 130;

export function isChildScreenId(value: unknown): value is ChildScreenId {
  return typeof value === 'string' && CHILD_SCREEN_IDS.has(value as ChildScreenId);
}

export function clampGeneratedReplyWindowHeight(height: number): number {
  return clamp(Math.round(height), 420, 640);
}

export function getChildWindowSize(screenId: ChildScreenId): { width: number; height: number } {
  if (screenId === 'refer-friends') return CHILD_WINDOW_COMPACT;
  if (screenId === 'generated-reply') return CHILD_WINDOW_GENERATED;
  return CHILD_WINDOW_SMALL;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function computeChildWindowBounds(
  parentBounds: Electron.Rectangle,
  screenId: ChildScreenId,
  workArea: Electron.Rectangle,
): Electron.Rectangle {
  const baseSize = getChildWindowSize(screenId);
  const height = Math.max(420, Math.min(baseSize.height, workArea.height - CHILD_WINDOW_MARGIN * 2));
  const width = Math.min(baseSize.width, workArea.width - CHILD_WINDOW_MARGIN * 2);
  const rawX = parentBounds.x + parentBounds.width + CHILD_WINDOW_GAP;
  const rawY = parentBounds.y + CHILD_WINDOW_TOP_OFFSET;

  return {
    x: clamp(rawX, workArea.x + CHILD_WINDOW_MARGIN, workArea.x + workArea.width - width - CHILD_WINDOW_MARGIN),
    y: clamp(rawY, workArea.y + CHILD_WINDOW_MARGIN, workArea.y + workArea.height - height - CHILD_WINDOW_MARGIN),
    width,
    height,
  };
}

export function buildChildWindowBounds(
  parentBounds: Electron.Rectangle,
  screenId: ChildScreenId,
): Electron.Rectangle {
  const display = screen.getDisplayMatching(parentBounds);
  return computeChildWindowBounds(parentBounds, screenId, display.workArea);
}
