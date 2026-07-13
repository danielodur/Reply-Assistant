import { app, BrowserWindow, dialog, ipcMain, Notification, shell, session } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildChildWindowBounds,
  clampGeneratedReplyWindowHeight,
  isChildScreenId,
  type ChildScreenId,
} from './childWindowLayout';

const WINDOW_WIDTH = 390;
const PANEL_OPEN_WIDTH = 574;
const WINDOW_HEIGHT = 650;
const PANEL_CLOSE_ANIMATION_MS = 300;
const MAX_DEV_LOAD_RETRIES = 8;
const AUTH_PROTOCOL = 'reply-assistant';

type AuthCallbackPayload = {
  access_token: string;
  refresh_token: string;
  type: string;
};

let mainWindowRef: BrowserWindow | null = null;
let pendingAuthCallbacks: AuthCallbackPayload[] = [];

function parseAuthCallbackUrl(rawUrl: string): AuthCallbackPayload | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== `${AUTH_PROTOCOL}:`) return null;
    if (parsed.hostname !== 'auth' || parsed.pathname !== '/callback') return null;

    const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return null;

    return {
      access_token,
      refresh_token,
      type: params.get('type') || 'signup',
    };
  } catch {
    return null;
  }
}

function forwardAuthCallback(payload: AuthCallbackPayload) {
  const target = mainWindowRef && !mainWindowRef.isDestroyed()
    ? mainWindowRef
    : BrowserWindow.getAllWindows().find(w => !w.isDestroyed()) ?? null;

  if (target) {
    target.webContents.send('auth-callback', payload);
    if (target.isMinimized()) target.restore();
    target.show();
    target.focus();
    return;
  }

  pendingAuthCallbacks.push(payload);
}

function handleAuthDeepLink(rawUrl: string) {
  const payload = parseAuthCallbackUrl(rawUrl);
  if (payload) {
    forwardAuthCallback(payload);
  }
}

function flushPendingAuthCallbacks() {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
  for (const payload of pendingAuthCallbacks) {
    mainWindowRef.webContents.send('auth-callback', payload);
  }
  pendingAuthCallbacks = [];
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(AUTH_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(AUTH_PROTOCOL);
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleAuthDeepLink(url);
});

type ChildWindowEntry = {
  window: BrowserWindow;
  docked: boolean;
};

function appendQuery(url: string, params: Record<string, string>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
}

function safeCsvFilename(value: unknown): string {
  const raw = typeof value === 'string' ? value : 'reply-assistant-table.csv';
  const cleaned = raw.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').slice(0, 80);
  return cleaned.toLowerCase().endsWith('.csv') ? cleaned : `${cleaned || 'reply-assistant-table'}.csv`;
}

type DesktopNotificationKind = 'new-mail' | 'draft-ready';

function isDesktopNotificationKind(value: unknown): value is DesktopNotificationKind {
  return value === 'new-mail' || value === 'draft-ready';
}

function safeBadgeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const integer = Math.floor(value);
  if (integer <= 0) return 0;
  // Cap at a reasonable upper bound so we never push a runaway number to the dock.
  return Math.min(integer, 999);
}

const createMainWindow = () => {
  const childWindows = new Map<ChildScreenId, ChildWindowEntry>();
  let suppressChildMoveEvents = false;
  let panelCloseAnimation: NodeJS.Timeout | null = null;

  const resolveChildScreenId = (win: BrowserWindow | null | undefined): ChildScreenId | null => {
    if (!win || win.isDestroyed()) return null;
    for (const [screenId, entry] of childWindows.entries()) {
      if (entry.window === win) return screenId;
    }
    return null;
  };

  const mainWindow = new BrowserWindow({
    show: false,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_WIDTH,
    minHeight: 500,
    maxWidth: PANEL_OPEN_WIDTH,
    maxHeight: 650,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    movable: true,
    center: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    transparent: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 12 },
    title: 'Business Reply Assistant',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      flushPendingAuthCallbacks();
    }
  });

  mainWindowRef = mainWindow;
  mainWindow.on('closed', () => {
    if (mainWindowRef === mainWindow) {
      mainWindowRef = null;
    }
  });

  const clampWindowSize = () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    const clampedWidth = Math.min(Math.max(currentWidth, WINDOW_WIDTH), PANEL_OPEN_WIDTH);
    const clampedHeight = Math.min(Math.max(currentHeight, 500), 650);

    if (clampedWidth !== currentWidth || clampedHeight !== currentHeight) {
      mainWindow.setSize(clampedWidth, clampedHeight);
    }
  };

  const setChildBoundsProgrammatically = (entry: ChildWindowEntry, bounds: Electron.Rectangle) => {
    if (entry.window.isDestroyed()) return;
    suppressChildMoveEvents = true;
    entry.window.setBounds(bounds, true);
    setImmediate(() => {
      suppressChildMoveEvents = false;
    });
  };

  const dockChildWindow = (screenId: ChildScreenId) => {
    const entry = childWindows.get(screenId);
    if (!entry || entry.window.isDestroyed()) return;

    entry.docked = true;
    setChildBoundsProgrammatically(
      entry,
      buildChildWindowBounds(mainWindow.getBounds(), screenId),
    );
  };

  const devServerUrl = process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173';
  const packagedIndexPath = path.join(__dirname, '../apps/web/dist/index.html');
  let devLoadRetryCount = 0;
  let devLoadRetryTimer: NodeJS.Timeout | null = null;

  const clearDevRetryTimer = () => {
    if (devLoadRetryTimer) {
      clearTimeout(devLoadRetryTimer);
      devLoadRetryTimer = null;
    }
  };

  const clearPanelCloseAnimation = () => {
    if (panelCloseAnimation) {
      clearInterval(panelCloseAnimation);
      panelCloseAnimation = null;
    }
  };

  const loadRenderer = () => {
    if (app.isPackaged) {
      void mainWindow.loadFile(packagedIndexPath);
      return;
    }

    void mainWindow.loadURL(devServerUrl);
  };

  const loadChildRenderer = (childWindow: BrowserWindow, screenId: ChildScreenId) => {
    if (app.isPackaged) {
      void childWindow.loadFile(packagedIndexPath, {
        query: {
          childScreen: screenId,
          childWindow: '1',
        },
      });
      return;
    }

    void childWindow.loadURL(appendQuery(devServerUrl, {
      childScreen: screenId,
      childWindow: '1',
    }));
  };

  const closeChildWindows = () => {
    for (const entry of childWindows.values()) {
      if (!entry.window.isDestroyed()) {
        entry.window.close();
      }
    }
    childWindows.clear();
  };

  const closeOtherChildWindows = (exceptScreenId: ChildScreenId) => {
    for (const [screenId, entry] of childWindows.entries()) {
      if (screenId === exceptScreenId || entry.window.isDestroyed()) continue;
      entry.window.close();
    }
  };

  const showDevLoadFallback = () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Business Reply Assistant</title>
          <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #ffffff; color: #334155; }
            .wrap { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
            .card { max-width: 360px; border: 1px solid #f1d7e3; border-radius: 16px; padding: 16px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08); }
            h1 { margin: 0; font-size: 15px; color: #0f172a; }
            p { margin: 8px 0 0; font-size: 12px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <h1>App is reconnecting</h1>
              <p>The desktop window is waiting for the local dev server. It will retry automatically.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    void mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
  };

  loadRenderer();

  if (!app.isPackaged && process.env.ELECTRON_DEBUG === 'true') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    devLoadRetryCount = 0;
    clearDevRetryTimer();
  });

  mainWindow.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription, _validatedURL, isMainFrame) => {
    if (!isMainFrame || app.isPackaged) {
      return;
    }

    clearDevRetryTimer();
    devLoadRetryCount += 1;

    if (devLoadRetryCount <= MAX_DEV_LOAD_RETRIES) {
      devLoadRetryTimer = setTimeout(() => {
        loadRenderer();
      }, 500);
      return;
    }

    showDevLoadFallback();
    devLoadRetryTimer = setTimeout(() => {
      loadRenderer();
    }, 1500);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Recover gracefully if the renderer hangs or crashes to avoid blank/frozen UI.
  mainWindow.on('unresponsive', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  mainWindow.webContents.on('render-process-gone', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  // On macOS, the green traffic-light can still try to zoom/fullscreen.
  // Force mini-app behavior by immediately restoring window constraints.
  mainWindow.on('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }
    clampWindowSize();
  });

  mainWindow.on('enter-full-screen', () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
    clampWindowSize();
  });

  mainWindow.on('enter-html-full-screen', () => {
    mainWindow.webContents.executeJavaScript('document.exitFullscreen?.()').catch(() => undefined);
    clampWindowSize();
  });

  mainWindow.on('resize', () => {
    clampWindowSize();
  });

  mainWindow.on('closed', () => {
    clearDevRetryTimer();
    clearPanelCloseAnimation();
    closeChildWindows();
  });

  ipcMain.removeHandler('desktop:set-panel-open');
  ipcMain.handle('desktop:set-panel-open', (_event, open: boolean) => {
    clearPanelCloseAnimation();
    const bounds = mainWindow.getBounds();
    const nextWidth = open ? PANEL_OPEN_WIDTH : WINDOW_WIDTH;

    if (bounds.width === nextWidth) {
      return;
    }

    // Keep the left edge fixed so only the right side expands/collapses.
    const nextX = bounds.x;

    if (open || bounds.width <= WINDOW_WIDTH) {
      mainWindow.setBounds(
        {
          x: nextX,
          y: bounds.y,
          width: nextWidth,
          height: bounds.height,
        },
        open,
      );
      return;
    }

    const startWidth = bounds.width;
    const startTime = Date.now();
    const tickClose = () => {
      if (mainWindow.isDestroyed()) {
        clearPanelCloseAnimation();
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / PANEL_CLOSE_ANIMATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      const width = Math.max(WINDOW_WIDTH, Math.round(startWidth + (WINDOW_WIDTH - startWidth) * eased));
      const currentBounds = mainWindow.getBounds();

      mainWindow.setBounds(
        {
          x: nextX,
          y: currentBounds.y,
          width,
          height: currentBounds.height,
        },
        false,
      );

      if (progress >= 1) {
        clearPanelCloseAnimation();
      }
    };

    tickClose();
    panelCloseAnimation = setInterval(tickClose, 16);
  });

  ipcMain.removeHandler('desktop:get-app-version');
  ipcMain.handle('desktop:get-app-version', () => app.getVersion());

  ipcMain.removeHandler('desktop:check-for-updates');
  ipcMain.handle('desktop:check-for-updates', async () => ({
    status: 'latest' as const,
    currentVersion: app.getVersion(),
  }));

  ipcMain.removeHandler('desktop:show-message-box');
  ipcMain.handle('desktop:show-message-box', async (_event, options: unknown) => {
    const payload = options && typeof options === 'object' ? options as Record<string, unknown> : {};
    const title = typeof payload.title === 'string' ? payload.title : '';
    const message = typeof payload.message === 'string' ? payload.message : '';
    const type: 'info' | 'warning' | 'error' =
      payload.type === 'info' || payload.type === 'warning' || payload.type === 'error'
        ? payload.type
        : 'info';

    const parent = mainWindowRef && !mainWindowRef.isDestroyed() ? mainWindowRef : null;
    const boxOptions = {
      type,
      title,
      message,
      buttons: ['OK'],
      defaultId: 0,
    };

    if (parent) {
      await dialog.showMessageBox(parent, boxOptions);
    } else {
      await dialog.showMessageBox(boxOptions);
    }

    return true;
  });

  ipcMain.removeHandler('desktop:open-child-screen');
  ipcMain.handle('desktop:open-child-screen', (_event, screenId: unknown) => {
    if (!isChildScreenId(screenId)) {
      return false;
    }

    closeOtherChildWindows(screenId);

    const existing = childWindows.get(screenId);
    if (existing && !existing.window.isDestroyed()) {
      if (existing.docked) {
        dockChildWindow(screenId);
      }
      existing.window.show();
      existing.window.focus();
      return true;
    }

    const childWindow = new BrowserWindow({
      show: false,
      ...buildChildWindowBounds(mainWindow.getBounds(), screenId),
      modal: false,
      frame: false,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: -100, y: -100 },
      closable: true,
      minimizable: false,
      maximizable: false,
      resizable: false,
      fullscreenable: false,
      movable: true,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      title: 'Business Reply Assistant',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    });
    childWindow.setWindowButtonVisibility(false);

    const entry: ChildWindowEntry = { window: childWindow, docked: true };
    childWindows.set(screenId, entry);

    childWindow.on('moved', () => {
      if (suppressChildMoveEvents) return;
      entry.docked = false;
    });

    childWindow.once('ready-to-show', () => {
      if (!childWindow.isDestroyed()) {
        childWindow.show();
        childWindow.focus();
      }
    });

    childWindow.on('closed', () => {
      childWindows.delete(screenId);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('desktop:child-screen-closed', screenId);
      }
    });

    childWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    loadChildRenderer(childWindow, screenId);
    return true;
  });

  ipcMain.removeHandler('desktop:close-child-screen');
  ipcMain.handle('desktop:close-child-screen', (_event, screenId?: unknown) => {
    if (screenId === undefined || screenId === null || screenId === '') {
      closeChildWindows();
      return true;
    }

    if (!isChildScreenId(screenId)) {
      return false;
    }

    const entry = childWindows.get(screenId);
    if (entry && !entry.window.isDestroyed()) {
      entry.window.close();
    }
    childWindows.delete(screenId);
    return true;
  });

  ipcMain.removeHandler('desktop:child-action');
  ipcMain.handle('desktop:child-action', (event, action: unknown) => {
    if (!action || typeof action !== 'object') {
      return false;
    }

    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('desktop:child-action', action);
      const actionType = (action as { type?: unknown }).type;
      const sourceWindow = BrowserWindow.fromWebContents(event.sender);
      const sourceScreenId = resolveChildScreenId(sourceWindow);
      // Generated-reply is its own work surface — keep it open while the user
      // edits, translates (update-generated-reply), or copies. They close it explicitly.
      const keepChildOpen =
        actionType === 'select-contact'
        || sourceScreenId === 'generated-reply';
      if (
        !keepChildOpen
        && sourceWindow
        && sourceWindow !== mainWindow
        && !sourceWindow.isDestroyed()
      ) {
        sourceWindow.close();
      }
    }
    return true;
  });

  ipcMain.removeHandler('desktop:resize-child-screen');
  ipcMain.handle('desktop:resize-child-screen', (event, screenId: unknown, height: unknown) => {
    if (screenId !== 'generated-reply' || typeof height !== 'number' || !Number.isFinite(height)) {
      return false;
    }

    const entry = childWindows.get('generated-reply');
    if (!entry || entry.window.isDestroyed()) {
      return false;
    }

    if (BrowserWindow.fromWebContents(event.sender) !== entry.window) {
      return false;
    }

    const nextHeight = clampGeneratedReplyWindowHeight(height);
    const bounds = entry.window.getBounds();
    if (bounds.height === nextHeight) {
      return true;
    }

    suppressChildMoveEvents = true;
    entry.window.setBounds({ ...bounds, height: nextHeight }, true);
    setImmediate(() => {
      suppressChildMoveEvents = false;
    });
    return true;
  });

  ipcMain.removeHandler('desktop:open-csv-file');
  ipcMain.handle('desktop:open-csv-file', async (_event, filename: unknown, csv: unknown) => {
    if (typeof csv !== 'string' || !csv.trim()) {
      return false;
    }

    const dir = path.join(os.tmpdir(), 'reply-assistant');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, safeCsvFilename(filename));
    await fs.writeFile(filePath, `\uFEFF${csv}`, 'utf8');
    await shell.openPath(filePath);
    return true;
  });

  ipcMain.removeHandler('desktop:notify');
  ipcMain.handle('desktop:notify', (_event, payload: unknown) => {
    if (!Notification.isSupported()) return false;
    if (!payload || typeof payload !== 'object') return false;
    const raw = payload as {
      kind?: unknown;
      title?: unknown;
      body?: unknown;
      contactId?: unknown;
      tag?: unknown;
    };
    if (!isDesktopNotificationKind(raw.kind)) return false;
    if (typeof raw.title !== 'string' || !raw.title.trim()) return false;
    if (typeof raw.body !== 'string') return false;

    const action = {
      kind: raw.kind,
      contactId: typeof raw.contactId === 'string' ? raw.contactId : undefined,
      tag: typeof raw.tag === 'string' ? raw.tag : undefined,
    };

    const notification = new Notification({
      title: raw.title,
      body: raw.body,
      silent: false,
    });
    notification.on('click', () => {
      if (!mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('desktop:notification-action', action);
      }
    });
    notification.show();
    return true;
  });

  ipcMain.removeHandler('desktop:quit-app');
  ipcMain.handle('desktop:quit-app', () => {
    app.quit();
    return true;
  });

  ipcMain.removeHandler('desktop:set-badge-count');
  ipcMain.handle('desktop:set-badge-count', (_event, count: unknown) => {
    const safe = safeBadgeCount(count);
    if (process.platform === 'darwin') {
      app.dock?.setBadge(safe > 0 ? String(safe) : '');
      return true;
    }
    // Linux + supported Windows builds use app.setBadgeCount; older Windows
    // simply ignore the call and return false \u2014 that's fine for our use case.
    try {
      return app.setBadgeCount(safe);
    } catch {
      return false;
    }
  });
};

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const deepLink = argv.find(arg => arg.startsWith(`${AUTH_PROTOCOL}://`));
    if (deepLink) {
      handleAuthDeepLink(deepLink);
    }
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      if (mainWindowRef.isMinimized()) mainWindowRef.restore();
      mainWindowRef.show();
      mainWindowRef.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();

    for (const arg of process.argv) {
      if (arg.startsWith(`${AUTH_PROTOCOL}://`)) {
        handleAuthDeepLink(arg);
      }
    }

    const filter = {
      urls: [
        'http://localhost:*/oauth/callback*',
        'https://business-reply-assistant.com/oauth/callback*',
      ],
    };

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
      const url = new URL(details.url);
      const code = url.searchParams.get('code');
      if (code) {
        const state = url.searchParams.get('state');
        BrowserWindow.getAllWindows()[0]?.webContents.send('oauth-callback', { code, state });
      }
      callback({ cancel: false });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
