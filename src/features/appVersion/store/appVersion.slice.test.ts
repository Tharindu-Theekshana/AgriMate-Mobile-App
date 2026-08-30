import { configureStore } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

jest.mock('../services/appVersion.service', () => ({
  appVersionApi: { check: jest.fn() },
}));

import { appVersionApi } from '../services/appVersion.service';
import { appVersionReducer, checkAppVersionThunk } from './appVersion.slice';

function testStore() {
  return configureStore({ reducer: { appVersion: appVersionReducer } });
}

const originalOS = Platform.OS;

afterEach(() => {
  jest.clearAllMocks();
  Platform.OS = originalOS;
});

describe('appVersion.slice', () => {
  it('MOB-VER-01: starts unchecked with no update flagged', () => {
    const state = testStore().getState().appVersion;
    expect(state.checked).toBe(false);
    expect(state.updateAvailable).toBe(false);
  });

  it('MOB-VER-02: skips the check entirely on web (store updates are native-only)', async () => {
    Platform.OS = 'web';
    const store = testStore();

    await store.dispatch(checkAppVersionThunk());

    expect(appVersionApi.check).not.toHaveBeenCalled();
    expect(store.getState().appVersion.checked).toBe(true);
    expect(store.getState().appVersion.updateAvailable).toBe(false);
  });

  it('MOB-VER-03: records an available update, including whether it is forced', async () => {
    Platform.OS = 'android';
    (appVersionApi.check as jest.Mock).mockResolvedValueOnce({
      updateAvailable: true, forceUpdate: true, latestVersion: '2.0.0', currentVersion: '1.0.0',
    });
    const store = testStore();

    await store.dispatch(checkAppVersionThunk());

    const state = store.getState().appVersion;
    expect(state.checked).toBe(true);
    expect(state.updateAvailable).toBe(true);
    expect(state.forceUpdate).toBe(true);
    expect(state.latestVersion).toBe('2.0.0');
  });

  it('MOB-VER-04: marks checked without flagging an update when already current', async () => {
    Platform.OS = 'android';
    (appVersionApi.check as jest.Mock).mockResolvedValueOnce({
      updateAvailable: false, forceUpdate: false, latestVersion: '1.0.0', currentVersion: '1.0.0',
    });
    const store = testStore();

    await store.dispatch(checkAppVersionThunk());

    const state = store.getState().appVersion;
    expect(state.checked).toBe(true);
    expect(state.updateAvailable).toBe(false);
  });

  it('MOB-VER-05: a failed version check is swallowed, still marking checked with no update', async () => {
    Platform.OS = 'android';
    (appVersionApi.check as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    const store = testStore();

    await store.dispatch(checkAppVersionThunk());

    const state = store.getState().appVersion;
    expect(state.checked).toBe(true);
    expect(state.updateAvailable).toBe(false);
  });
});
