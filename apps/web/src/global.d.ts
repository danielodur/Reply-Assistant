export {};

type DesktopNotificationKind = 'new-mail' | 'draft-ready';

type DesktopNotificationPayload = {
  kind: DesktopNotificationKind;
  title: string;
  body: string;
  contactId?: string;
  tag?: string;
};

type DesktopNotificationAction = {
  kind: DesktopNotificationKind;
  contactId?: string;
  tag?: string;
};

type AuthCallbackPayload = {
  access_token: string;
  refresh_token: string;
  type: string;
};

type UpdateCheckResult = {
  status: 'latest' | 'available';
  currentVersion: string;
  latestVersion?: string;
};

declare global {
  interface Window {
    desktopApp?: {
      platform: string;
      isElectron: boolean;
      isChildWindow?: boolean;
      setPanelOpen?: (open: boolean) => Promise<void>;
      getAppVersion?: () => Promise<string>;
      checkForUpdates?: () => Promise<UpdateCheckResult>;
      quitApp?: () => Promise<void>;
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
      onChildAction?: (callback: (action: unknown) => void) => () => void;
      onChildScreenClosed?: (callback: (screenId: string) => void) => () => void;
      onNotificationAction?: (callback: (action: DesktopNotificationAction) => void) => () => void;
      onAuthCallback?: (callback: (payload: AuthCallbackPayload) => void) => () => void;
    };
  }
}
