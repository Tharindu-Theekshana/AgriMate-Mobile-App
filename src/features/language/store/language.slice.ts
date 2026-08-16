import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { bootstrapLanguage, type LanguageCode, setLanguage } from '@/shared/i18n';

interface LanguageState {
  code: LanguageCode;
}

const initialState: LanguageState = { code: 'en' };

export const restoreLanguageThunk = createAsyncThunk('language/restore', async () => {
  return bootstrapLanguage();
});

export const setLanguageThunk = createAsyncThunk('language/setLanguage', async (code: LanguageCode) => {
  await setLanguage(code);
  return code;
});

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreLanguageThunk.fulfilled, (state, action: PayloadAction<LanguageCode>) => {
        state.code = action.payload;
      })
      .addCase(setLanguageThunk.fulfilled, (state, action: PayloadAction<LanguageCode>) => {
        state.code = action.payload;
      });
  },
});

export const languageReducer = languageSlice.reducer;
