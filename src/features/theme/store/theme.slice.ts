import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ThemeMode } from '@/shared/theme/theme';

const STORAGE_KEY = 'agrimate.themeMode';

interface ThemeSliceState {
  mode: ThemeMode;
}

const initialState: ThemeSliceState = { mode: 'system' };

export const restoreThemeThunk = createAsyncThunk('theme/restore', async () => {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system' as ThemeMode;
});

export const setThemeModeThunk = createAsyncThunk('theme/setMode', async (mode: ThemeMode) => {
  await AsyncStorage.setItem(STORAGE_KEY, mode);
  return mode;
});

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreThemeThunk.fulfilled, (state, action: PayloadAction<ThemeMode>) => {
        state.mode = action.payload;
      })
      .addCase(setThemeModeThunk.fulfilled, (state, action: PayloadAction<ThemeMode>) => {
        state.mode = action.payload;
      });
  },
});

export const themeReducer = themeSlice.reducer;
