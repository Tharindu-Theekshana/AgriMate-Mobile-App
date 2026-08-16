import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth';
import { appVersionReducer } from '@/features/appVersion';
import { languageReducer } from '@/features/language';
import { themeReducer } from '@/features/theme';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    language: languageReducer,
    appVersion: appVersionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
