import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Body, Screen } from '@/shared/components/ui';
import type { ThemeMode } from '@/shared/theme/theme';
import { font, radius, spacing } from '@/shared/theme/theme';

import { useAppTheme } from '@/features/theme';

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useAppTheme();

  const options: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: t('settings.light'), icon: 'sunny' },
    { key: 'dark', label: t('settings.dark'), icon: 'moon' },
    { key: 'system', label: t('settings.system'), icon: 'phone-portrait' },
  ];

  return (
    <Screen scroll>
      <Body muted style={{ marginBottom: spacing.lg }}>{t('settings.modeDesc')}</Body>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {options.map((opt) => {
          const active = mode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setMode(opt.key)}
              style={{
                flex: 1,
                paddingVertical: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.pale : colors.surface,
                alignItems: 'center',
              }}>
              <Ionicons name={opt.icon} size={26} color={active ? colors.primary : colors.inkSoft} />
              <Text style={{ marginTop: 6, fontWeight: '700', color: active ? colors.primaryDeep : colors.inkSoft, fontSize: font.sm }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
