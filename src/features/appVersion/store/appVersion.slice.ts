import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { appVersionApi, type VersionCheck } from '../services/appVersion.service';

interface AppVersionState {
  checked: boolean;
  updateAvailable: boolean;
  forceUpdate: boolean;
  latestVersion: string;
}

const initialState: AppVersionState = {
  checked: false,
  updateAvailable: false,
  forceUpdate: false,
  latestVersion: '',
};

export const checkAppVersionThunk = createAsyncThunk('appVersion/check', async (): Promise<VersionCheck | null> => {
  if (Platform.OS === 'web') return null; // store updates are native-only
  const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  try {
    return await appVersionApi.check(platform, version);
  } catch {
    return null; 
  }
});

const appVersionSlice = createSlice({
  name: 'appVersion',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(checkAppVersionThunk.fulfilled, (state, action) => {
      state.checked = true;
      if (action.payload?.updateAvailable) {
        state.updateAvailable = true;
        state.forceUpdate = action.payload.forceUpdate;
        state.latestVersion = action.payload.latestVersion;
      }
    });
  },
});

export const appVersionReducer = appVersionSlice.reducer;
