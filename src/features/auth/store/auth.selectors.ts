import type { RootState } from '@/app/store';

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsGuest = (state: RootState) => state.auth.isGuest;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectAuthInitializing = (state: RootState) => state.auth.initializing;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
