import { Platform } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

export const lightPalette = {
  bg: '#FFF7E8',
  bgElevated: '#FFFFFF',
  surface: '#EAF9FF',
  surfaceSoft: '#D9F7E8',
  card: '#FFFFFF',
  border: 'rgba(18, 31, 52, 0.10)',
  borderStrong: 'rgba(18, 31, 52, 0.18)',
  text: '#122033',
  textSoft: '#334155',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  tint: '#19A7CE',
  tintStrong: '#0E7490',
  accent: '#FF7A59',
  accentSoft: '#FFD166',
  success: '#22C55E',
  danger: '#FF5A7A',
  warning: '#F59E0B',
  overlay: 'rgba(18, 31, 52, 0.12)',
  topicTrack: 'rgba(18,31,52,0.12)',
  white: '#FFFFFF',
};

export const darkPalette = {
  bg: '#101828',
  bgElevated: '#17213A',
  surface: '#223052',
  surfaceSoft: '#263B63',
  card: '#1C2947',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  text: '#F8FAFC',
  textSoft: '#DCEBFF',
  textMuted: '#A8B8D8',
  textFaint: '#7890B6',
  tint: '#5EEAD4',
  tintStrong: '#A7F3D0',
  accent: '#FF9F1C',
  accentSoft: '#FFD166',
  success: '#34D399',
  danger: '#FB7185',
  warning: '#FBBF24',
  overlay: 'rgba(6, 10, 23, 0.55)',
  topicTrack: 'rgba(255,255,255,0.18)',
  white: '#FFFFFF',
};

export const appPalettes = {
  light: lightPalette,
  dark: darkPalette,
};

export const Colors = {
  light: {
    text: lightPalette.text,
    background: lightPalette.bg,
    tint: lightPalette.tint,
    icon: lightPalette.textMuted,
    tabIconDefault: lightPalette.textMuted,
    tabIconSelected: lightPalette.text,
  },
  dark: {
    text: darkPalette.text,
    background: darkPalette.bg,
    tint: darkPalette.tint,
    icon: darkPalette.textMuted,
    tabIconDefault: darkPalette.textMuted,
    tabIconSelected: darkPalette.text,
  },
};

// Legacy export for untouched screens. New work should use useAppTheme().
export const AppPalette = darkPalette;

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'Georgia',
    rounded: 'Avenir Next',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
  },
});

export const LetterSpacing = {
  dense: -0.8,
  normal: 0,
  ui: 1.1,
};
