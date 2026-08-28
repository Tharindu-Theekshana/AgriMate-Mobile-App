import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import { font } from '@/shared/theme/theme';
import type { Palette } from '@/shared/theme/theme';

import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';
import { useColors } from '@/features/theme';
import type { AuthStackParamList } from './types';

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
    headerShown: true,
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.ink,
    headerTitleAlign: 'center',
    headerTitleStyle: { fontWeight: '700', fontSize: font.lg, color: colors.ink },
    headerShadowVisible: false,
    headerBackVisible: false,
    headerLeft: () => <HeaderBack tint={colors.ink} />,
    contentStyle: { backgroundColor: colors.background },
    title: '',
  };
}

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const colors = useColors();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={stackHeader(colors)} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={stackHeader(colors)} />
    </Stack.Navigator>
  );
}
