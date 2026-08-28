import { useRef } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { useColors } from '@/features/theme';
import { font, radius, spacing } from '@/shared/theme/theme';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/** A segmented, boxed OTP entry field — a real single TextInput underneath, drawn as digit cells. */
export function OtpInput({ value, onChangeText, length = 6, autoFocus = true }: Props) {
  const c = useColors();
  const inputRef = useRef<TextInput>(null);
  const cells = Array.from({ length }, (_, i) => value[i] ?? '');

  function handleChange(text: string) {
    onChangeText(text.replace(/[^0-9]/g, '').slice(0, length));
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {cells.map((digit, i) => {
          const isCursor = i === value.length;
          const filled = digit !== '';
          return (
            <View
              key={i}
              style={{
                width: 46,
                height: 56,
                borderRadius: radius.md,
                borderWidth: filled || isCursor ? 2 : 1.5,
                borderColor: isCursor ? c.primary : filled ? c.primaryDeep : c.border,
                backgroundColor: filled ? c.pale : c.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: font.xl, fontWeight: '800', color: c.ink }}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
        style={{ position: 'absolute', opacity: 0, height: 56, width: '100%' }}
      />
    </Pressable>
  );
}
