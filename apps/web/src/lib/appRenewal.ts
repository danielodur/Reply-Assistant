import type { AppTranslations } from '../i18n/translations';

export type UpdateCheckResult = {
  status: 'latest' | 'available';
  currentVersion: string;
  latestVersion?: string;
};

export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  if (window.desktopApp?.checkForUpdates) {
    return window.desktopApp.checkForUpdates();
  }

  const currentVersion = window.desktopApp?.getAppVersion
    ? await window.desktopApp.getAppVersion()
    : '0.1.0';

  return { status: 'latest', currentVersion };
}

export async function showRenewLatestDialog(copy: AppTranslations['moreFeatures']): Promise<void> {
  if (window.desktopApp?.showMessageBox) {
    await window.desktopApp.showMessageBox({
      type: 'info',
      title: copy.renewLatestTitle,
      message: copy.renewLatestBody,
    });
    return;
  }

  window.alert(`${copy.renewLatestTitle}\n\n${copy.renewLatestBody}`);
}

export async function runRenewCheck(copy: AppTranslations['moreFeatures']): Promise<void> {
  const result = await checkForAppUpdates();

  if (result.status === 'latest') {
    await showRenewLatestDialog(copy);
    return;
  }

  const title = copy.renewLatestTitle;
  const body = result.latestVersion
    ? `Version ${result.latestVersion} is available. You are on ${result.currentVersion}.`
    : copy.renewLatestBody;

  if (window.desktopApp?.showMessageBox) {
    await window.desktopApp.showMessageBox({ type: 'info', title, message: body });
    return;
  }

  window.alert(`${title}\n\n${body}`);
}
