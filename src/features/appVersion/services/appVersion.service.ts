import { api } from '@/shared/services/api/client';

export interface VersionCheck {
  updateAvailable: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
}

export const appVersionApi = {
  check: (platform: 'ANDROID' | 'IOS', version: string) =>
    api.get<VersionCheck>('/api/app-version/check', { params: { platform, version } }).then((r) => r.data),
};
