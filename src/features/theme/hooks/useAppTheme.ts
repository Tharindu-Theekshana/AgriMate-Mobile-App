import { useColorScheme } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getColors, type Palette, type ThemeMode } from '@/shared/theme/theme';

import { selectThemeMode } from '../store/theme.selectors';
import { setThemeModeThunk } from '../store/theme.slice';

interface AppTheme {
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}

export function useAppTheme(): AppTheme {
  const mode = useAppSelector(selectThemeMode);
  const system = useColorScheme();
  const dispatch = useAppDispatch();

  const scheme: 'light' | 'dark' = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const colors = getColors(scheme);

  const setMode = (m: ThemeMode) => {
    void dispatch(setThemeModeThunk(m));
  };

  return { mode, scheme, colors, setMode };
}

export function useColors(): Palette {
  return useAppTheme().colors;
}
