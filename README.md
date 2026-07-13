# Business Reply Assistant

A multilingual, workflow-driven business communication assistant built as a floating desktop application. This project is designed as a productivity tool, not a chatbot: paste message, generate polished reply, copy, and send.

## Desktop Goal

The app runs as an Electron desktop application with a VPN-style floating experience:

- Standalone desktop app (no browser chrome)
- Small always-on-top window
- Fast copy-paste workflow
- Minimal friction UI

## Current Architecture

- Frontend: React + TypeScript + Vite + Tailwind in `apps/web`
- Backend API: Node.js in `apps/api`
- Desktop runtime: Electron main/preload in `electron`
- Electron build output: `dist-electron`
- Frontend production output: `apps/web/dist`

## Project Structure

```text
.
├── AGENT_STATUS.md
├── INTEGRATION_GUIDE.md
├── apps
│   ├── api
│   └── web
├── docs
├── electron
│   ├── main.ts
│   ├── preload.ts
│   └── tsconfig.json
├── references
├── plans
├── projects
├── dist-electron
├── packages
├── supabase
└── README.md
```

## Agent Coordination

Codex and Claude Code share the master coordination files:

- `AGENT_STATUS.md`
- `INTEGRATION_GUIDE.md`
- `references/SHARED_CONTEXT.json`
- `plans/*`
- `projects/*`

Routine app changes update `.codex/*` and these master files. Routine app changes do not require edits to `.claude/*` unless Claude Code runtime instructions or permissions changed.

Useful coordination commands:

```bash
npm run agents:validate
npm run agents:status
npm run agents:sync
```

## Dependencies (Desktop)

Installed at workspace root:

- `electron`
- `electron-builder`
- `wait-on`
- `concurrently`
- `typescript`
- `@types/node`

## Electron Window Configuration

Configured in `electron/main.ts`:

- Width: 390
- Height: 620
- Min size: 350 x 500
- Max size: 420 x 650
- `resizable: true`
- `alwaysOnTop: true`
- `center: true`
- `autoHideMenuBar: true`

Security defaults:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- Preload bridge via `electron/preload.ts`

## Dev vs Production Loading Logic

Electron loading strategy:

- Development: loads `http://localhost:5173`
- Production: loads `apps/web/dist/index.html`

This behavior is implemented in `electron/main.ts` using `app.isPackaged`.

## Scripts

Root scripts in `package.json`:

- `npm run dev`:
  - Runs web + API for browser development
- `npm run desktop:dev`:
  - Runs web dev server, API server, Electron TS watch, and launches Electron
- `npm run electron:watch`:
  - Watches and compiles Electron TS files to `dist-electron`
- `npm run electron:build`:
  - One-time compile of Electron TS files
- `npm run build:web`:
  - Builds React app into `apps/web/dist`
- `npm run build`:
  - Builds web + Electron
- `npm run desktop:pack`:
  - Packages desktop app with `electron-builder`

## Step-by-Step Setup

1. Install dependencies:

```bash
npm install
```

2. Start desktop app in development mode:

```bash
npm run desktop:dev
```

3. Build production artifacts:

```bash
npm run build
```

4. Package desktop app:

```bash
npm run desktop:pack
```

Packaged output is generated in `release`.

## Connecting React to Electron

- Electron displays the React app in `BrowserWindow`
- React remains in `apps/web` and is not coupled to Electron internals
- If renderer needs desktop-only info, use the preload bridge exposed at `window.desktopApp`

## Full Electron Main Process and Preload

Implemented files:

- `electron/main.ts`
- `electron/preload.ts`

These files include secure defaults and environment-aware loading behavior for both dev and production.

## Optional UX Improvements (Prepared for Next Phase)

The structure is ready for:

- Global shortcut to toggle window
- System tray icon + quick actions
- Runtime toggle for always-on-top
- Auto-launch on startup
- Frameless mode + custom React title bar

## Product Direction

Business Reply Assistant remains focused on:

- multilingual business replies
- company-context personalization
- local and export communication workflows

The desktop form factor makes it a daily-use productivity tool that is always available and faster than generic browser AI tools.
