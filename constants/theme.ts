import { Platform } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

export const lightPalette = {
  bg: '#F5F1EA',
  bgElevated: '#FAF7F2',
  surface: '#F0EBE2',
  surfaceSoft: '#E7E1D6',
  card: '#F9F5EE',
  border: 'rgba(25, 23, 19, 0.12)',
  borderStrong: 'rgba(25, 23, 19, 0.22)',
  text: '#171614',
  textSoft: '#4E4A43',
  textMuted: '#736D64',
  textFaint: '#948D82',
  tint: '#1C1A17',
  tintStrong: '#111111',
  accent: '#24211D',
  accentSoft: '#37342E',
  success: '#24211D',
  danger: '#24211D',
  warning: '#24211D',
  overlay: 'rgba(18, 17, 14, 0.12)',
  topicTrack: 'rgba(20,18,15,0.12)',
  white: '#FFFFFF',
};

export const darkPalette = {
  bg: '#111110',
  bgElevated: '#151513',
  surface: '#1A1917',
  surfaceSoft: '#20201D',
  card: '#171613',
  border: 'rgba(244, 239, 229, 0.10)',
  borderStrong: 'rgba(244, 239, 229, 0.18)',
  text: '#F4EFE5',
  textSoft: '#D4CDC1',
  textMuted: '#A59C8E',
  textFaint: '#7D776E',
  tint: '#F4EFE5',
  tintStrong: '#FFFFFF',
  accent: '#F0ECE3',
  accentSoft: '#E0D9CD',
  success: '#F4EFE5',
  danger: '#F4EFE5',
  warning: '#F4EFE5',
  overlay: 'rgba(10, 10, 9, 0.48)',
  topicTrack: 'rgba(244,239,229,0.18)',
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
    sans: 'Menlo',
    serif: 'Georgia',
    rounded: 'Menlo',
    mono: 'Menlo',
  },
  android: {
    sans: 'monospace',
    serif: 'serif',
    rounded: 'monospace',
    mono: 'monospace',
  },
  default: {
    sans: 'monospace',
    serif: 'serif',
    rounded: 'monospace',
    mono: 'monospace',
  },
  web: {
    sans: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    mono: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
  },
});

export const LetterSpacing = {
  dense: -0.8,
  normal: 0,
  ui: 1.1,
};
