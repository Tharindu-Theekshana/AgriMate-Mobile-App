import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { apiErrorMessage } from '@/shared/services/api/api';
import { clearLocalData } from '@/shared/services/db';
import { tokenStorage } from '@/shared/services/storage/tokenStorage';
import type { User } from '@/shared/types/api.types';

import { authApi, userApi } from '../services/auth.service';

const GUEST_KEY = 'agrimate.guest';

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
  role?: 'FARMER' | 'AGRONOMIST';
  proofImageUri?: string;
}

interface AuthState {
  user: User | null;
  isGuest: boolean;
  initializing: boolean;
  status: AsyncStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isGuest: false,
  initializing: true,
  status: 'idle',
  error: null,
};

export const bootstrapAuthThunk = createAsyncThunk('auth/bootstrap', async () => {
  try {
    const token = await tokenStorage.getAccess();
    if (token) {
      const me = await userApi.me();
      return { user: me, isGuest: false };
    }
    if ((await AsyncStorage.getItem(GUEST_KEY)) === '1') {
      return { user: null, isGuest: true };
    }
    return { user: null, isGuest: false };
  } catch {
    await tokenStorage.clear();
    return { user: null, isGuest: false };
  }
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ identifier, password }: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(identifier, password);
      await tokenStorage.save(res.accessToken, res.refreshToken);
      await AsyncStorage.removeItem(GUEST_KEY);
      return res.user;
    } catch (e) {
      return rejectWithValue(apiErrorMessage(e));
    }
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (body: RegisterBody, { rejectWithValue }) => {
    try {
      const res = await authApi.register(body);
      await tokenStorage.save(res.accessToken, res.refreshToken);
      await AsyncStorage.removeItem(GUEST_KEY);
      return res.user;
    } catch (e) {
      return rejectWithValue(apiErrorMessage(e));
    }
  },
);

export const continueAsGuestThunk = createAsyncThunk('auth/continueAsGuest', async () => {
  await AsyncStorage.setItem(GUEST_KEY, '1');
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await tokenStorage.clear();
  await AsyncStorage.removeItem(GUEST_KEY);
  try {
    clearLocalData();
  } catch {
  }
});

export const refreshUserThunk = createAsyncThunk('auth/refreshUser', async () => {
  return userApi.me();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    sessionExpired(state) {
      state.user = null;
      state.isGuest = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuthThunk.pending, (state) => {
        state.initializing = true;
      })
      .addCase(bootstrapAuthThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isGuest = action.payload.isGuest;
        state.initializing = false;
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isGuest = false;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Login failed';
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isGuest = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Registration failed';
      })
      .addCase(continueAsGuestThunk.fulfilled, (state) => {
        state.user = null;
        state.isGuest = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.isGuest = false;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(refreshUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, sessionExpired, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
