import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import type { Palette } from '@/shared/theme/theme';
import { font } from '@/shared/theme/theme';

import DiseaseDetailScreen from '@/features/disease/screens/DiseaseDetailScreen';
import FarmDetailScreen from '@/features/farm/screens/FarmDetailScreen';
import CropDetailScreen from '@/features/crop/screens/CropDetailScreen';
import ScanDetailScreen from '@/features/scan/screens/ScanDetailScreen';
import ScanResultScreen from '@/features/scan/screens/ScanResultScreen';
import HistoryScreen from '@/features/scan/screens/HistoryScreen';
import NotificationsScreen from '@/features/notification/screens/NotificationsScreen';
import AboutScreen from '@/features/settings/screens/AboutScreen';
import AccountScreen from '@/features/settings/screens/AccountScreen';
import AppearanceScreen from '@/features/settings/screens/AppearanceScreen';
import LanguageScreen from '@/features/settings/screens/LanguageScreen';
import NotificationSettingsScreen from '@/features/settings/screens/NotificationSettingsScreen';
import { useColors } from '@/features/theme';
import { MainTabNavigator } from './MainTabNavigator';
import type { MainStackParamList } from './types';

/** Clean, modern back button used across all stacked screens. */
function HeaderBack({ tint }: { tint: string }) {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;
  return (
    <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ paddingRight: 8 }}>
      <Ionicons name="chevron-back" size={26} color={tint} />
    </Pressable>
  );
}

/** Theme-aware native-stack header (fixes dark-mode header + centers the title). */
function stackHeader(colors: Palette): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.ink,
    headerTitleAlign: 'center',
    headerTitleStyle: { fontWeight: '700', fontSize: font.lg, color: colors.ink },
    headerShadowVisible: false,
    headerBackVisible: false,
    headerLeft: () => <HeaderBack tint={colors.ink} />,
    contentStyle: { backgroundColor: colors.background },
  };
}

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const colors = useColors();
  const header = stackHeader(colors);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="FarmDetail" component={FarmDetailScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="CropDetail" component={CropDetailScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="ScanDetail" component={ScanDetailScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAppearance" component={AppearanceScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsLanguage" component={LanguageScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsNotifications" component={NotificationSettingsScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAccount" component={AccountScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAbout" component={AboutScreen} options={{ headerShown: true, ...header }} />
    </Stack.Navigator>
  );
}
