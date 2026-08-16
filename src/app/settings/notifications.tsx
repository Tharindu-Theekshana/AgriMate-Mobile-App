import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';

import { Body, Card, Loading, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { registerForPushIfNeeded } from '@/notifications/notifications';
import { DEFAULT_PREFS, loadPrefs, savePrefs, type NotifPrefs } from '@/notifications/prefs';
import { font, radius, spacing } from '@/theme/theme';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  async function update(patch: Partial<NotifPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    if (patch.master !== undefined) {
      toast.success(patch.master ? t('notif.enabled') : t('notif.disabled'));
      if (patch.master) await registerForPushIfNeeded();
    }
  }

  if (!prefs) return <Loading />;

  const masterOn = prefs.master;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: t('notif.title') }} />

      <Card style={{ marginBottom: spacing.lg }}>
        <Row
          icon="notifications"
          title={t('notif.master')}
          desc={t('notif.masterDesc')}
          value={prefs.master}
          onChange={(v) => update({ master: v })}
          colors={colors}
        />
      </Card>

      <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.inkSoft, marginBottom: spacing.sm }}>
        {t('notif.title')}
      </Text>
      <Card style={{ gap: spacing.md }}>
        <Row
          icon="megaphone"
          title={t('notif.appTitle')}
          desc={isAuthenticated ? t('notif.appDesc') : t('notif.registeredOnly')}
          value={prefs.app && masterOn && isAuthenticated}
          disabled={!masterOn || !isAuthenticated}
          onChange={(v) => update({ app: v })}
          colors={colors}
        />
        <Divider colors={colors} />
        <Row
          icon="alert-circle"
          title={t('notif.outbreak')}
          desc={t('notif.outbreakDesc')}
          value={prefs.outbreak && masterOn}
          disabled={!masterOn}
          onChange={(v) => update({ outbreak: v })}
          colors={colors}
        />
        <Divider colors={colors} />
        <Row
          icon="leaf"
          title={t('notif.reminder')}
          desc={t('notif.reminderDesc')}
          value={prefs.reminder && masterOn}
          disabled={!masterOn}
          onChange={(v) => update({ reminder: v })}
          colors={colors}
        />
        {isAuthenticated && (
          <>
            <Divider colors={colors} />
            <Row
              icon="chatbubbles"
              title={t('notif.qa')}
              desc={t('notif.qaDesc')}
              value={prefs.qa && masterOn}
              disabled={!masterOn}
              onChange={(v) => update({ qa: v })}
              colors={colors}
            />
          </>
        )}
      </Card>

      {!isAuthenticated && (
        <Body muted style={{ fontSize: font.sm, marginTop: spacing.md }}>{t('notif.registeredOnly')}</Body>
      )}
    </Screen>
  );
}

function Row({
  icon,
  title,
  desc,
  value,
  onChange,
  disabled,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.5 : 1 }}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: font.sm, color: colors.inkSoft }}>{desc}</Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ height: 1, backgroundColor: colors.border, borderRadius: radius.sm }} />;
}
