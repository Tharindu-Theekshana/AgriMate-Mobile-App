import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import type { Palette } from '@/shared/theme/theme';
import { font } from '@/shared/theme/theme';

import CropDetailScreen from '@/features/crop/screens/CropDetailScreen';
import DiseaseDetailScreen from '@/features/disease/screens/DiseaseDetailScreen';
import FarmDetailScreen from '@/features/farm/screens/FarmDetailScreen';
import NotificationsScreen from '@/features/notification/screens/NotificationsScreen';
import AskQuestionScreen from '@/features/question/screens/AskQuestionScreen';
import QuestionDetailScreen from '@/features/question/screens/QuestionDetailScreen';
import QuestionsScreen from '@/features/question/screens/QuestionsScreen';
import HistoryScreen from '@/features/scan/screens/HistoryScreen';
import ScanDetailScreen from '@/features/scan/screens/ScanDetailScreen';
import ScanResultScreen from '@/features/scan/screens/ScanResultScreen';
import AboutScreen from '@/features/settings/screens/AboutScreen';
import AccountScreen from '@/features/settings/screens/AccountScreen';
import AppearanceScreen from '@/features/settings/screens/AppearanceScreen';
import LanguageScreen from '@/features/settings/screens/LanguageScreen';
import NotificationSettingsScreen from '@/features/settings/screens/NotificationSettingsScreen';
import { useColors } from '@/features/theme';
import { MainTabNavigator } from './MainTabNavigator';
import type { MainStackParamList } from './types';

function HeaderBack({ tint }: { tint: string }) {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;
  return (
    <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ paddingRight: 8 }}>
      <Ionicons name="chevron-back" size={26} color={tint} />
    </Pressable>
  );
}

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
      <Stack.Screen name="Questions" component={QuestionsScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="AskQuestion" component={AskQuestionScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="QuestionDetail" component={QuestionDetailScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAppearance" component={AppearanceScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsLanguage" component={LanguageScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsNotifications" component={NotificationSettingsScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAccount" component={AccountScreen} options={{ headerShown: true, ...header }} />
      <Stack.Screen name="SettingsAbout" component={AboutScreen} options={{ headerShown: true, ...header }} />
    </Stack.Navigator>
  );
}
