import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadow } from '@/shared/theme/theme';

import LearnScreen from '@/features/disease/screens/LearnScreen';
import FarmsScreen from '@/features/farm/screens/FarmsScreen';
import HomeScreen from '@/features/home/screens/HomeScreen';
import ScanScreen from '@/features/scan/screens/ScanScreen';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import { useColors } from '@/features/theme';
import type { TabParamList } from './types';

function ScanButton({ onPress }: BottomTabBarButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
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

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabNavigator() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Farms"
        component={FarmsScreen}
        options={{ title: t('tabs.farms'), tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: '', tabBarButton: (props) => <ScanButton {...props} /> }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{ title: t('tabs.learn'), tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
