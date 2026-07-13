import type { MiniScreenId } from '../workbench/types';

export function openMiniScreen(
  screenId: MiniScreenId,
  setActiveMiniScreen: (id: MiniScreenId | null) => void,
): void {
  if (window.desktopApp?.openChildScreen) {
    void window.desktopApp.openChildScreen(screenId);
    return;
  }
  setActiveMiniScreen(screenId);
}
