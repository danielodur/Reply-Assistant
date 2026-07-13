import type { AppSettings } from '../hooks/useAppSettings';
import { isWithinQuietHours } from './quietHours';

/**
 * Cross-surface desktop notification dispatcher.
 *
 * Prefers Electron's native API (so action clicks can focus + dispatch into
 * the panel via IPC) and falls back to the browser Notification API when the
 * app runs in plain browser mode. Quiet hours and the user's "native
 * notifications" toggle gate every call so the in-app attention toast is the
 * sole signal during muted windows.
 */

export type DesktopNotificationKind = 'new-mail' | 'draft-ready';

export type DesktopNotificationRequest = {
  kind: DesktopNotificationKind;
  title: string;
  body: string;
  contactId?: string;
  /** Optional dedupe tag. Browser API uses it natively; the Electron path forwards it untouched. */
  tag?: string;
};

export type DesktopNotificationAction = {
  kind: DesktopNotificationKind;
  contactId?: string;
  tag?: string;
};

type NotifySettings = Pick<
  AppSettings,
  'nativeNotifications' | 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd'
>;

export function isNotificationAllowed(now: Date, settings: NotifySettings): boolean {
  if (!settings.nativeNotifications) return false;
  if (isWithinQuietHours(now, {
    enabled: settings.quietHoursEnabled,
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
  })) return false;
  return true;
}

function dispatchViaElectron(request: DesktopNotificationRequest): boolean {
  if (typeof window === 'undefined') return false;
  const notify = window.desktopApp?.notify;
  if (!notify) return false;
  void notify({
    kind: request.kind,
    title: request.title,
    body: request.body,
    contactId: request.contactId,
    tag: request.tag,
  });
  return true;
}

function dispatchViaBrowser(request: DesktopNotificationRequest): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.Notification === 'undefined') return false;
  if (window.Notification.permission === 'denied') return false;

  const showOnce = () => {
    try {
      // eslint-disable-next-line no-new -- Notification side-effects show the popup.
      new window.Notification(request.title, {
        body: request.body,
        tag: request.tag,
      });
    } catch {
      // Some browsers (older Safari, embedded webviews) throw on construction.
    }
  };

  if (window.Notification.permission === 'granted') {
    showOnce();
    return true;
  }

  void window.Notification.requestPermission().then(permission => {
    if (permission === 'granted') showOnce();
  }).catch(() => {
    // Permission flow rejected — silently fall back to the in-app toast.
  });
  return true;
}

export function dispatchDesktopNotification(
  request: DesktopNotificationRequest,
  settings: NotifySettings,
  now: Date = new Date(),
): boolean {
  if (!isNotificationAllowed(now, settings)) return false;
  if (dispatchViaElectron(request)) return true;
  return dispatchViaBrowser(request);
}

export function setDesktopBadgeCount(count: number): void {
  if (typeof window === 'undefined') return;
  const api = window.desktopApp?.setBadgeCount;
  if (!api) return;
  void api(count);
}

export function subscribeToNotificationActions(
  callback: (action: DesktopNotificationAction) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const subscribe = window.desktopApp?.onNotificationAction;
  if (!subscribe) return () => {};
  return subscribe(callback);
}
