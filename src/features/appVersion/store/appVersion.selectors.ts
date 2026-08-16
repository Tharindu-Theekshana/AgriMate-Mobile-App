import type { RootState } from '@/app/store';

export const selectAppVersionChecked = (state: RootState) => state.appVersion.checked;
export const selectUpdateAvailable = (state: RootState) => state.appVersion.updateAvailable;
export const selectForceUpdate = (state: RootState) => state.appVersion.forceUpdate;
export const selectLatestVersion = (state: RootState) => state.appVersion.latestVersion;
