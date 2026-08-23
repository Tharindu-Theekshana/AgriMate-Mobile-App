import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useColors } from '@/features/theme';
import { font, radius, spacing } from '@/shared/theme/theme';
import { formatDate } from '@/shared/utils/format';

export function DateField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const c = useColors();
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={{ fontSize: font.sm, fontWeight: '600', color: c.inkSoft, marginBottom: spacing.xs }}>{label}</Text> : null}
      <Pressable
        onPress={() => setShow(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surfaceAlt,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 52,
        }}>
        <Ionicons name="calendar-outline" size={18} color={c.inkSoft} />
        <Text style={{ flex: 1, marginLeft: spacing.sm, fontSize: font.md, color: value ? c.ink : c.inkFaint }}>
          {value ? formatDate(value) : (placeholder ?? '—')}
        </Text>
        {value ? (
          <Pressable hitSlop={10} onPress={() => onChange('')}>
            <Ionicons name="close-circle" size={18} color={c.inkFaint} />
          </Pressable>
        ) : null}
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShow(false);
            if (event.type === 'set' && date) onChange(date.toISOString().slice(0, 10));
          }}
        />
      )}
    </View>
  );
}

export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  allowClear,
}: {
  label?: string;
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T | null;
  onChange: (v: T | null) => void;
  allowClear?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={{ fontSize: font.sm, fontWeight: '600', color: c.inkSoft, marginBottom: spacing.xs }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(active && allowClear ? null : opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: active ? c.primary : c.border,
                backgroundColor: active ? c.pale : c.surface,
              }}>
              {opt.icon ? <Ionicons name={opt.icon} size={16} color={active ? c.primary : c.inkSoft} /> : null}
              <Text style={{ color: active ? c.primaryDeep : c.ink, fontWeight: '600' }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
