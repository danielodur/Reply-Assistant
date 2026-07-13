import { contextBridge, ipcRenderer } from 'electron';

export type DesktopNotificationKind = 'new-mail' | 'draft-ready';

export type DesktopNotificationPayload = {
  kind: DesktopNotificationKind;
  title: string;
  body: string;
  contactId?: string;
  /** Optional opaque tag — used to coalesce identical follow-up notifications. */
  tag?: string;
};

export type DesktopNotificationAction = {
  kind: DesktopNotificationKind;
  contactId?: string;
  tag?: string;
};

export type AuthCallbackPayload = {
  access_token: string;
  refresh_token: string;
  type: string;
};

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  isElectron: true,
  isChildWindow: new URLSearchParams(window.location.search).get('childWindow') === '1',
  setPanelOpen: (open: boolean) => ipcRenderer.invoke('desktop:set-panel-open', open),
  getAppVersion: () => ipcRenderer.invoke('desktop:get-app-version') as Promise<string>,
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-for-updates') as Promise<{
    status: 'latest' | 'available';
    currentVersion: string;
    latestVersion?: string;
  }>,
  showMessageBox: (options: { type?: 'info' | 'warning' | 'error'; title: string; message: string }) =>
    ipcRenderer.invoke('desktop:show-message-box', options) as Promise<boolean>,
  openCsvFile: (filename: string, csv: string) => ipcRenderer.invoke('desktop:open-csv-file', filename, csv) as Promise<boolean>,
  openChildScreen: (screenId: string) => ipcRenderer.invoke('desktop:open-child-screen', screenId) as Promise<boolean>,
  closeChildScreen: (screenId?: string) => ipcRenderer.invoke('desktop:close-child-screen', screenId) as Promise<boolean>,
  sendChildAction: (action: unknown) => ipcRenderer.invoke('desktop:child-action', action) as Promise<boolean>,
  resizeChildScreen: (screenId: string, height: number) => ipcRenderer.invoke('desktop:resize-child-screen', screenId, height) as Promise<boolean>,
  notify: (payload: DesktopNotificationPayload) => ipcRenderer.invoke('desktop:notify', payload) as Promise<boolean>,
  setBadgeCount: (count: number) => ipcRenderer.invoke('desktop:set-badge-count', count) as Promise<boolean>,
  quitApp: () => ipcRenderer.invoke('desktop:quit-app') as Promise<boolean>,
  onChildAction: (callback: (action: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: unknown) => callback(action);
    ipcRenderer.on('desktop:child-action', listener);
    return () => {
      ipcRenderer.removeListener('desktop:child-action', listener);
    };
  },
  onChildScreenClosed: (callback: (screenId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, screenId: string) => callback(screenId);
    ipcRenderer.on('desktop:child-screen-closed', listener);
    return () => {
      ipcRenderer.removeListener('desktop:child-screen-closed', listener);
    };
  },
  onNotificationAction: (callback: (action: DesktopNotificationAction) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: DesktopNotificationAction) => callback(action);
    ipcRenderer.on('desktop:notification-action', listener);
    return () => {
      ipcRenderer.removeListener('desktop:notification-action', listener);
    };
  },
  onAuthCallback: (callback: (payload: AuthCallbackPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AuthCallbackPayload) => callback(payload);
    ipcRenderer.on('auth-callback', listener);
    return () => {
      ipcRenderer.removeListener('auth-callback', listener);
    };
  },
});

declare global {
  interface Window {
    desktopApp?: {
      platform: string;
      isElectron: boolean;
      isChildWindow?: boolean;
      setPanelOpen?: (open: boolean) => Promise<void>;
      getAppVersion?: () => Promise<string>;
      checkForUpdates?: () => Promise<{
        status: 'latest' | 'available';
        currentVersion: string;
        latestVersion?: string;
      }>;
      showMessageBox?: (options: {
        type?: 'info' | 'warning' | 'error';
        title: string;
        message: string;
      }) => Promise<boolean>;
      openCsvFile?: (filename: string, csv: string) => Promise<boolean>;
      openChildScreen?: (screenId: string) => Promise<boolean>;
      closeChildScreen?: (screenId?: string) => Promise<boolean>;
      sendChildAction?: (action: unknown) => Promise<boolean>;
      resizeChildScreen?: (screenId: string, height: number) => Promise<boolean>;
      notify?: (payload: DesktopNotificationPayload) => Promise<boolean>;
      setBadgeCount?: (count: number) => Promise<boolean>;
      quitApp?: () => Promise<boolean>;
      onChildAction?: (callback: (action: unknown) => void) => () => void;
      onChildScreenClosed?: (callback: (screenId: string) => void) => () => void;
      onNotificationAction?: (callback: (action: DesktopNotificationAction) => void) => () => void;
      onAuthCallback?: (callback: (payload: AuthCallbackPayload) => void) => () => void;
    };
  }
}
