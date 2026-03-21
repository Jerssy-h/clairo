/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#7C6CFF';
const tintColorDark = '#C9C2FF';

export const Colors = {
  light: {
    text: '#1F1B2E',
    background: '#F8F7FF',
    tint: tintColorLight,
    icon: '#7A7595',
    tabIconDefault: '#7A7595',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F4F1FF',
    background: '#0F1020',
    tint: tintColorDark,
    icon: '#A7A2C3',
    tabIconDefault: '#7E7A98',
    tabIconSelected: tintColorDark,
  },
};

export const AppPalette = {
  bg: '#0B1020',
  bgElevated: '#131A31',
  surface: '#18213D',
  surfaceSoft: '#1F2948',
  card: '#202B4D',
  border: 'rgba(189, 182, 255, 0.16)',
  borderStrong: 'rgba(201, 194, 255, 0.24)',
  text: '#F6F4FF',
  textSoft: '#C5C0E4',
  textMuted: '#9B96B8',
  textFaint: '#7D7897',
  tint: '#9B8CFF',
  tintStrong: '#7C6CFF',
  accent: '#6FD6C7',
  accentSoft: '#9AE6DA',
  success: '#7EE0A1',
  danger: '#FF8E9E',
  warning: '#FFC978',
  overlay: 'rgba(8, 11, 24, 0.82)',
  topicTrack: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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