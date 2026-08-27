import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '@/app/hooks';
import { shadow, spacing } from '@/shared/theme/theme';

import { selectUser } from '@/features/auth/store/auth.selectors';
import { useColors } from '@/features/theme';
import { navigate } from '@/navigation/navigationRef';

export function AskAgronomistFab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(selectUser);

  if (!user || (user.role !== 'FARMER' && user.role !== 'AGRONOMIST')) return null;

  return (
    <Pressable
      onPress={() => navigate('Questions')}
      style={{
        position: 'absolute',
        right: spacing.lg,
        bottom: insets.bottom + 84,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadow.card,
      }}>
      <Ionicons name="chatbubble-ellipses" size={26} color={colors.white} />
    </Pressable>
  );
}
