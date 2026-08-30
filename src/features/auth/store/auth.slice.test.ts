import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';

import type { AuthResponse, User } from '@/shared/types/api.types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../services/auth.service', () => ({
  authApi: { login: jest.fn(), register: jest.fn(), confirmPasswordReset: jest.fn() },
  userApi: { me: jest.fn() },
}));
jest.mock('@/shared/services/storage/tokenStorage', () => ({
  tokenStorage: { save: jest.fn(), getAccess: jest.fn(), clear: jest.fn() },
}));
jest.mock('@/shared/services/db', () => ({ clearLocalData: jest.fn() }));

import { clearLocalData } from '@/shared/services/db';
import { tokenStorage } from '@/shared/services/storage/tokenStorage';
import { authApi } from '../services/auth.service';
import {
    authReducer,
    confirmPasswordResetThunk,
    continueAsGuestThunk,
    loginThunk,
    logoutThunk,
    sessionExpired,
} from './auth.slice';

const farmer: User = {
  id: 1, username: 'kasun', email: 'kasun@agrimate.lk', name: 'Kasun Perera',
  role: 'FARMER', roles: ['FARMER'], accountType: 'FARMER', agronomistStatus: 'NONE', suspended: false,
};

function testStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('auth.slice', () => {
  it('MOB-AUTH-01: starts uninitialized with no user, not a guest', () => {
    const state = testStore().getState().auth;
    expect(state.user).toBeNull();
    expect(state.isGuest).toBe(false);
    expect(state.initializing).toBe(true);
  });

  it('MOB-AUTH-02: loginThunk stores the token and user on success', async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'tok', refreshToken: 'r', user: farmer,
    } satisfies AuthResponse);
    const store = testStore();

    await store.dispatch(loginThunk({ identifier: 'kasun', password: 'secret123' }));

    expect(tokenStorage.save).toHaveBeenCalledWith('tok', 'r');
    expect(store.getState().auth.user).toEqual(farmer);
    expect(store.getState().auth.status).toBe('succeeded');
  });

  it('MOB-AUTH-03: loginThunk clears the guest flag on successful login', async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'tok', refreshToken: 'r', user: farmer,
    } satisfies AuthResponse);
    const store = testStore();

    await store.dispatch(loginThunk({ identifier: 'kasun', password: 'secret123' }));

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('agrimate.guest');
  });

  it('MOB-AUTH-04: loginThunk surfaces the backend error message on failure', async () => {
    (authApi.login as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Invalid credentials' } },
    });
    const store = testStore();

    await store.dispatch(loginThunk({ identifier: 'kasun', password: 'wrong' }));

    expect(store.getState().auth.status).toBe('failed');
    expect(store.getState().auth.user).toBeNull();
    expect(tokenStorage.save).not.toHaveBeenCalled();
  });

  it('MOB-AUTH-05: confirmPasswordResetThunk logs the user in with fresh tokens', async () => {
    (authApi.confirmPasswordReset as jest.Mock).mockResolvedValueOnce({
      accessToken: 'new-tok', refreshToken: 'new-r', user: farmer,
    } satisfies AuthResponse);
    const store = testStore();

    await store.dispatch(
      confirmPasswordResetThunk({ email: 'kasun@agrimate.lk', code: '111222', newPassword: 'newSecret1' }),
    );

    expect(tokenStorage.save).toHaveBeenCalledWith('new-tok', 'new-r');
    expect(store.getState().auth.user).toEqual(farmer);
  });

  it('MOB-AUTH-06: continueAsGuestThunk marks the session as guest and persists the flag', async () => {
    const store = testStore();

    await store.dispatch(continueAsGuestThunk());

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('agrimate.guest', '1');
    expect(store.getState().auth.isGuest).toBe(true);
    expect(store.getState().auth.user).toBeNull();
  });

  it('MOB-AUTH-07: logoutThunk clears tokens, local data, and guest flag', async () => {
    const store = testStore();
    store.dispatch({ type: 'auth/login/fulfilled', payload: farmer });

    await store.dispatch(logoutThunk());

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(clearLocalData).toHaveBeenCalled();
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.isGuest).toBe(false);
  });

  it('MOB-AUTH-08: sessionExpired reducer clears the user without touching storage', () => {
    const store = testStore();
    store.dispatch({ type: 'auth/login/fulfilled', payload: farmer });

    store.dispatch(sessionExpired());

    expect(store.getState().auth.user).toBeNull();
    expect(tokenStorage.clear).not.toHaveBeenCalled();
  });
});
