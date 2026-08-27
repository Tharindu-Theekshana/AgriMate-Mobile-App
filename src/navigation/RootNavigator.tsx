import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Loading } from '@/shared/components/ui';

import { AskAgronomistFab } from '@/features/agronomist/components/AskAgronomistFab';
import { UpdateGate } from '@/features/appVersion';
import { bootstrapAuthThunk, selectAuthInitializing, selectIsGuest, selectUser } from '@/features/auth';
import { restoreLanguageThunk } from '@/features/language';
import { restoreThemeThunk, useAppTheme } from '@/features/theme';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef } from './navigationRef';

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { scheme } = useAppTheme();
  const user = useAppSelector(selectUser);
  const isGuest = useAppSelector(selectIsGuest);
  const initializing = useAppSelector(selectAuthInitializing);
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    void dispatch(bootstrapAuthThunk());
    void dispatch(restoreThemeThunk());
    void dispatch(restoreLanguageThunk()).finally(() => setLangReady(true));
  }, [dispatch]);

  if (initializing || !langReady) return <Loading />;

  const signedIn = !!user || isGuest;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationRef} linking={{ prefixes: ['agrimate://'] }}>
        {signedIn ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      {signedIn && <AskAgronomistFab />}
      <UpdateGate />
    </>
  );
}
