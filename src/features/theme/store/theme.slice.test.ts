import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { restoreThemeThunk, setThemeModeThunk, themeReducer } from './theme.slice';

function testStore() {
  return configureStore({ reducer: { theme: themeReducer } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('theme.slice', () => {
  it('MOB-THEME-01: defaults to "system" before anything is restored', () => {
    expect(testStore().getState().theme.mode).toBe('system');
  });

  it('MOB-THEME-02: restoreThemeThunk applies a previously saved valid mode', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');
    const store = testStore();

    await store.dispatch(restoreThemeThunk());

    expect(store.getState().theme.mode).toBe('dark');
  });

  it('MOB-THEME-03: restoreThemeThunk falls back to "system" for a corrupt/unknown stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-a-real-mode');
    const store = testStore();

    await store.dispatch(restoreThemeThunk());

    expect(store.getState().theme.mode).toBe('system');
  });

  it('MOB-THEME-04: setThemeModeThunk persists and applies the new mode', async () => {
    const store = testStore();

    await store.dispatch(setThemeModeThunk('light'));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('agrimate.themeMode', 'light');
    expect(store.getState().theme.mode).toBe('light');
  });

  it('MOB-THEME-05: restoreThemeThunk falls back to "system" when nothing was ever saved', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const store = testStore();

    await store.dispatch(restoreThemeThunk());

    expect(store.getState().theme.mode).toBe('system');
  });
});
