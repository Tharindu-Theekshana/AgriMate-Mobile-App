import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/features/theme';
import { font, radius, shadow, spacing } from '@/shared/theme/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  title?: string;
  actions?: ToastAction[];
  /** Safety net: called if this toast is torn down without one of its actions being pressed (e.g. superseded by a newer toast). */
  onUnmount?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  title?: string;
  actions?: ToastAction[];
  onUnmount?: () => void;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  /** Custom-toast replacement for `Alert.alert` confirmation dialogs. Resolves `true` if confirmed. */
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

let externalShow: ((message: string, options?: ToastOptions) => void) | null = null;
let externalConfirm: ((message: string, options?: ConfirmOptions) => Promise<boolean>) | null = null;
export const toast = {
  show: (m: string, o?: ToastOptions) => externalShow?.(m, o),
  success: (m: string) => externalShow?.(m, { type: 'success' }),
  error: (m: string) => externalShow?.(m, { type: 'error' }),
  info: (m: string) => externalShow?.(m, { type: 'info' }),
  warning: (m: string) => externalShow?.(m, { type: 'warning' }),
  confirm: (m: string, o?: ConfirmOptions) => externalConfirm?.(m, o) ?? Promise.resolve(false),
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
      title: options?.title,
      actions: options?.actions,
      onUnmount: options?.onUnmount,
    });
  }, []);

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        let settled = false;
        const resolveOnce = (value: boolean) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        show(message, {
          type: options?.destructive ? 'warning' : 'info',
          title: options?.title,
          actions: [
            { label: options?.cancelLabel ?? 'Cancel', onPress: () => resolveOnce(false) },
            {
              label: options?.confirmLabel ?? 'Confirm',
              destructive: options?.destructive,
              onPress: () => resolveOnce(true),
            },
          ],
          // if the toast disappears without a button press (e.g. another toast supersedes it), don't hang forever
          onUnmount: () => resolveOnce(false),
        });
      });
    },
    [show],
  );

  useEffect(() => {
    externalShow = show;
    externalConfirm = confirm;
    return () => {
      externalShow = null;
      externalConfirm = null;
    };
  }, [show, confirm]);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, { type: 'success' }),
      error: (m) => show(m, { type: 'error' }),
      info: (m) => show(m, { type: 'info' }),
      warning: (m) => show(m, { type: 'warning' }),
      confirm,
    }),
    [show, confirm],
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
  const hasActions = !!item.actions?.length;

  const accent =
    item.type === 'success'
      ? colors.primary
      : item.type === 'error'
        ? colors.danger
        : item.type === 'warning'
          ? colors.warning
          : colors.info;

  const close = useCallback(
    (after?: () => void) => {
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        after?.();
        onDone();
      });
    },
    [anim, onDone],
  );

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 14 }).start();
    if (hasActions) return;
    const timer = setTimeout(() => close(), item.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, item.duration, hasActions]);

  const unmountHandled = useRef(false);
  useEffect(() => {
    return () => {
      if (!unmountHandled.current) item.onUnmount?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        disabled={hasActions}
        onPress={() => close()}
        style={{
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
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name={ICONS[item.type]} size={22} color={accent} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            {item.title ? (
              <Text style={{ color: colors.ink, fontSize: font.sm, fontWeight: '800', marginBottom: 2 }}>
                {item.title}
              </Text>
            ) : null}
            <Text style={{ color: colors.ink, fontSize: font.sm, fontWeight: item.title ? '500' : '600' }}>
              {item.message}
            </Text>
          </View>
        </View>

        {hasActions && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md }}>
            {item.actions!.map((action, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  unmountHandled.current = true;
                  close(action.onPress);
                }}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.sm,
                  backgroundColor: action.destructive ? colors.danger : colors.pale,
                }}>
                <Text
                  style={{
                    fontSize: font.sm,
                    fontWeight: '700',
                    color: action.destructive ? '#fff' : colors.primaryDeep,
                  }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
