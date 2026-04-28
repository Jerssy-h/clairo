import { useAppTheme } from '@/lib/AppThemeContext';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function Logo({ size = 48 }: { size?: number }) {
  const { palette, isDark } = useAppTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Rect
        x="1"
        y="1"
        width="94"
        height="94"
        rx="22"
        fill={palette.bgElevated}
        stroke={palette.borderStrong}
        strokeWidth="1.5"
      />
      <Circle cx="48" cy="48" r="26" fill="none" stroke={palette.text} strokeWidth="5" opacity={isDark ? 0.96 : 0.88} />
      <Path
        d="M61 31 C55 26, 47 24, 39 27 C28 31, 22 42, 24 54 C26 67, 37 74, 48 74 C54 74, 59 72, 63 68"
        fill="none"
        stroke={palette.bgElevated}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <Path
        d="M58 48 H74"
        fill="none"
        stroke={palette.text}
        strokeWidth="5"
        strokeLinecap="square"
        opacity={0.95}
      />
    </Svg>
  );
}
