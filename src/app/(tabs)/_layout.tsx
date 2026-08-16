import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useColors } from '@/context/ThemeContext';
import { shadow } from '@/theme/theme';

/** Central elevated camera button (camera-first UX, spec §11). */
function ScanButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push('/scan')}
      style={{ top: -22, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: colors.background,
          ...shadow.card,
        }}>
        <Ionicons name="scan" size={30} color={colors.white} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="farms"
        options={{ title: t('tabs.farms'), tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }}
      />
      <Tabs.Screen name="scan" options={{ title: '', tabBarButton: () => <ScanButton /> }} />
      <Tabs.Screen
        name="learn"
        options={{ title: t('tabs.learn'), tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
      />
      {/* History is reachable from the Scan screen, not the tab bar. */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
