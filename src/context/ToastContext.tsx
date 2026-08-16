import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/context/ThemeContext';
import { font, radius, shadow, spacing } from '@/theme/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

// Module singleton so non-component code (e.g. the axios error handler) can toast too.
let externalShow: ((message: string, options?: ToastOptions) => void) | null = null;
export const toast = {
  show: (m: string, o?: ToastOptions) => externalShow?.(m, o),
  success: (m: string) => externalShow?.(m, { type: 'success' }),
  error: (m: string) => externalShow?.(m, { type: 'error' }),
  info: (m: string) => externalShow?.(m, { type: 'info' }),
  warning: (m: string) => externalShow?.(m, { type: 'warning' }),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, options?: ToastOptions) => {
    counter.current += 1;
    setCurrent({
      id: counter.current,
      message,
      type: options?.type ?? 'info',
      duration: options?.duration ?? 3000,
    });
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
    };
  }, [show]);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, { type: 'success' }),
      error: (m) => show(m, { type: 'error' }),
      info: (m) => show(m, { type: 'info' }),
      warning: (m) => show(m, { type: 'warning' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && <ToastView key={current.id} item={current} onDone={() => setCurrent(null)} />}
    </ToastContext.Provider>
  );
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const accent =
    item.type === 'success'
      ? colors.primary
      : item.type === 'error'
        ? colors.danger
        : item.type === 'warning'
          ? colors.warning
          : colors.info;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 14 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onDone);
    }, item.duration);
    return () => clearTimeout(timer);
  }, [anim, item.duration, onDone]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + spacing.sm,
        left: spacing.lg,
        right: spacing.lg,
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
      }}>
      <Pressable
        onPress={() =>
          Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(onDone)
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accent,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          ...shadow.card,
        }}>
        <Ionicons name={ICONS[item.type]} size={22} color={accent} />
        <Text style={{ flex: 1, marginLeft: spacing.sm, color: colors.ink, fontSize: font.sm, fontWeight: '600' }}>
          {item.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
