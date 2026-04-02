import { Platform } from 'react-native';

const tintColorLight = '#5A6B7E';
const tintColorDark = '#C4CED9';

export const Colors = {
  light: {
    text: '#1F2A36',
    background: '#F3F5F7',
    tint: tintColorLight,
    icon: '#7A8794',
    tabIconDefault: '#8A95A1',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E6EBF0',
    background: '#10161D',
    tint: tintColorDark,
    icon: '#9AA9B7',
    tabIconDefault: '#7F8B97',
    tabIconSelected: tintColorDark,
  },
};

export const AppPalette = {
  bg: '#10161D',
  bgElevated: '#161E27',
  surface: '#1B2530',
  surfaceSoft: '#24303D',
  card: '#212C37',
  border: 'rgba(184, 196, 208, 0.16)',
  borderStrong: 'rgba(184, 196, 208, 0.28)',
  text: '#E6EBF0',
  textSoft: '#C5D0DA',
  textMuted: '#99A8B5',
  textFaint: '#7F8D99',
  tint: '#8FA0B2',
  tintStrong: '#6F8398',
  accent: '#8CAFA3',
  accentSoft: '#B6D1C8',
  success: '#7DAE96',
  danger: '#C97C84',
  warning: '#C7A773',
  overlay: 'rgba(9, 13, 17, 0.84)',
  topicTrack: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
