import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui';
import { UpdateGate } from '@/components/UpdateGate';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncProvider';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { bootstrapLanguage } from '@/i18n';
import type { Palette } from '@/theme/theme';
import { font } from '@/theme/theme';

/** Clean, modern back button used across all stacked screens. */
function HeaderBack({ tint }: { tint: string }) {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return (
    <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 8 }}>
      <Ionicons name="chevron-back" size={26} color={tint} />
    </Pressable>
  );
}

/** Theme-aware native-stack header (fixes dark-mode header + centers the title). */
function stackHeader(colors: Palette) {
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.ink,
    headerTitleAlign: 'center' as const,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: font.lg, color: colors.ink },
    headerShadowVisible: false,
    headerBackVisible: false,
    headerLeft: () => <HeaderBack tint={colors.ink} />,
    contentStyle: { backgroundColor: colors.background },
  };
}

/** Redirects between the auth flow and the main app based on session (account or guest). */
function AuthGate() {
  const { user, isGuest, initializing } = useAuth();
  const { colors, scheme } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const signedIn = !!user || isGuest;

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!signedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (signedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [signedIn, initializing, segments, router]);

  if (initializing) return <Loading />;

  const header = stackHeader(colors);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="farm/[id]" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="crop/[id]" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="scan/result" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="scan/[id]" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="disease/[key]" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="settings/appearance" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="settings/language" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="settings/notifications" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="settings/account" options={{ headerShown: true, ...header }} />
        <Stack.Screen name="settings/about" options={{ headerShown: true, ...header }} />
      </Stack>
      <UpdateGate />
    </>
  );
}

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    bootstrapLanguage().finally(() => setLangReady(true));
  }, []);

  if (!langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <SyncProvider>
                <AuthGate />
              </SyncProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
