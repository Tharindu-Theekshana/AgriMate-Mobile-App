/**
 * AgriMate design tokens — green & white, with a full dark palette.
 * Camera-first, large touch targets, color-coded severity (spec §11).
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Palette {
  primary: string;
  primaryDeep: string;
  accent: string;
  pale: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  border: string;
  white: string;
  danger: string;
  warning: string;
  healthy: string;
  info: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  severityNone: string;
  /** Overlay for translucent fills on the primary surface. */
  onPrimaryFaint: string;
}

export const lightColors: Palette = {
  primary: '#2C5F2D',
  primaryDeep: '#27500A',
  accent: '#4CAF50',
  pale: '#EAF3DE',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F8F2',
  ink: '#1A2E1A',
  inkSoft: '#5A6B57',
  inkFaint: '#8A968A',
  border: '#E2E8DC',
  white: '#FFFFFF',
  danger: '#A32D2D',
  warning: '#BA7517',
  healthy: '#2C5F2D',
  info: '#2B6CB0',
  severityHigh: '#A32D2D',
  severityMedium: '#BA7517',
  severityLow: '#7A8B27',
  severityNone: '#2C5F2D',
  onPrimaryFaint: '#DCEBD2',
};

export const darkColors: Palette = {
  primary: '#5DA85E',
  primaryDeep: '#7CC47D',
  accent: '#4CAF50',
  pale: '#1E2A1C',
  background: '#0E140D',
  surface: '#161E13',
  surfaceAlt: '#1B2418',
  ink: '#ECF2E8',
  inkSoft: '#A7B3A2',
  inkFaint: '#71806C',
  border: '#2A3626',
  white: '#FFFFFF',
  danger: '#E57373',
  warning: '#E0A458',
  healthy: '#7CC47D',
  info: '#6FA8DC',
  severityHigh: '#E57373',
  severityMedium: '#E0A458',
  severityLow: '#B5C76A',
  severityNone: '#7CC47D',
  onPrimaryFaint: '#0E140D',
};

/** Default export kept as the light palette for any non-reactive usage. */
export const colors = lightColors;

export function getColors(mode: 'light' | 'dark'): Palette {
  return mode === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export function severityColor(p: Palette, severity?: string | null): string {
  switch (severity) {
    case 'HIGH': return p.severityHigh;
    case 'MEDIUM': return p.severityMedium;
    case 'LOW': return p.severityLow;
    case 'NONE': return p.severityNone;
    default: return p.inkSoft;
  }
}
