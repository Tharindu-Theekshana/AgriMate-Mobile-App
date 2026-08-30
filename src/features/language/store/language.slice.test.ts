import { configureStore } from '@reduxjs/toolkit';

jest.mock('@/shared/i18n', () => ({
  bootstrapLanguage: jest.fn(),
  setLanguage: jest.fn(),
}));

import { bootstrapLanguage, setLanguage } from '@/shared/i18n';
import { languageReducer, restoreLanguageThunk, setLanguageThunk } from './language.slice';

function testStore() {
  return configureStore({ reducer: { language: languageReducer } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('language.slice', () => {
  it('MOB-LANG-01: defaults to English before anything is restored', () => {
    expect(testStore().getState().language.code).toBe('en');
  });

  it('MOB-LANG-02: restoreLanguageThunk applies whatever bootstrapLanguage resolves', async () => {
    (bootstrapLanguage as jest.Mock).mockResolvedValueOnce('si');
    const store = testStore();

    await store.dispatch(restoreLanguageThunk());

    expect(store.getState().language.code).toBe('si');
  });

  it('MOB-LANG-03: setLanguageThunk persists the new language via i18n and updates state', async () => {
    (setLanguage as jest.Mock).mockResolvedValueOnce(undefined);
    const store = testStore();

    await store.dispatch(setLanguageThunk('ta'));

    expect(setLanguage).toHaveBeenCalledWith('ta');
    expect(store.getState().language.code).toBe('ta');
  });

  it('MOB-LANG-04: setLanguageThunk supports switching back to English', async () => {
    (setLanguage as jest.Mock).mockResolvedValue(undefined);
    const store = testStore();
    await store.dispatch(setLanguageThunk('si'));

    await store.dispatch(setLanguageThunk('en'));

    expect(store.getState().language.code).toBe('en');
  });
});
