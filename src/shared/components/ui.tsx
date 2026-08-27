import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    type PressableProps,
    type StyleProp,
    type TextInputProps,
    type TextStyle,
    type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/features/theme';
import { font, radius, shadow, spacing, type Palette } from '@/shared/theme/theme';
import { resolveImageUrl } from '@/shared/utils/format';

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewProps['style'];
}) {
  const c = useColors();
  const inner = padded ? { padding: spacing.lg } : undefined;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { paddingBottom: spacing.xxl }, style]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontSize: font.xxl, fontWeight: '800', color: c.ink }, style]}>{children}</Text>;
}
export function Heading({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontSize: font.lg, fontWeight: '700', color: c.ink }, style]}>{children}</Text>;
}
export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const c = useColors();
  return <Text style={[{ fontSize: font.md, color: muted ? c.inkSoft : c.ink, lineHeight: 22 }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: PressableProps['onPress'];
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewProps['style'];
}) {
  const c = useColors();
  const isDanger = variant === 'danger';
  const bg =
    variant === 'ghost'
      ? 'transparent'
      : variant === 'secondary'
        ? c.pale
        : isDanger
          ? c.danger
          : c.primary;
  const fg = variant === 'secondary' ? c.primaryDeep : variant === 'ghost' ? c.primary : c.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { paddingVertical: spacing.sm },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={20} color={fg} style={{ marginRight: spacing.sm }} />}
          <Text style={{ fontSize: font.md, fontWeight: '700', color: fg }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function TextField({ label, style, ...props }: TextInputProps & { label?: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={{ fontSize: font.sm, fontWeight: '600', color: c.inkSoft, marginBottom: spacing.xs }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.inkFaint}
        style={[
          {
            backgroundColor: c.surfaceAlt,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            minHeight: 52,
            fontSize: font.md,
            color: c.ink,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewProps['style']; onPress?: PressableProps['onPress'] }) {
  const c = useColors();
  const cardStyle = [
    {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow.card,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <View style={cardStyle}>{children}</View>
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function Avatar({
  uri,
  name,
  size = 40,
  style,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewProps['style'];
}) {
  const c = useColors();
  const resolved = resolveImageUrl(uri ?? undefined);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.pale,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}>
      {resolved ? (
        <Image source={{ uri: resolved }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: c.primary }}>
          {(name?.trim()?.[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export function SeverityBadge({ severity, label }: { severity?: string | null; label: string }) {
  const c = useColors();
  const map: Record<string, string> = {
    HIGH: c.severityHigh,
    MEDIUM: c.severityMedium,
    LOW: c.severityLow,
    NONE: c.severityNone,
  };
  const color = map[severity ?? ''] ?? c.inkSoft;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ fontSize: font.sm, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={{ fontSize: font.lg, fontWeight: '700', color: c.ink }}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={c.inkFaint} />
      <Text style={{ fontSize: font.md, color: c.inkSoft, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

export function FormError({ message }: { message?: string | null }) {
  const c = useColors();
  if (!message) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${c.danger}14`,
        borderWidth: 1,
        borderColor: c.danger,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
      }}>
      <Ionicons name="alert-circle" size={18} color={c.danger} />
      <Text style={{ flex: 1, marginLeft: spacing.sm, color: c.danger, fontSize: font.sm, fontWeight: '600' }}>
        {message}
      </Text>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  right?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.pale, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={c.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ fontSize: font.md, fontWeight: '700', color: c.ink }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: font.sm, color: c.inkSoft, marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={20} color={c.inkFaint} />}
    </Pressable>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

export type { Palette };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
});
