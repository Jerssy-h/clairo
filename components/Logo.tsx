import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

export default function Logo({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Defs>
        <LinearGradient id="logo-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1C1C2E" />
          <Stop offset="100%" stopColor="#0D0D0D" />
        </LinearGradient>
        <LinearGradient id="logo-face" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F0F0F0" />
        </LinearGradient>
        <LinearGradient id="logo-ear" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#3A3A5C" />
          <Stop offset="100%" stopColor="#2A2A4A" />
        </LinearGradient>
        <LinearGradient id="logo-patch-l" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#1A1A2E" />
          <Stop offset="100%" stopColor="#12121F" />
        </LinearGradient>
        <LinearGradient id="logo-patch-r" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1A1A2E" />
          <Stop offset="100%" stopColor="#12121F" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      <Rect width="400" height="400" rx="90" fill="url(#logo-bg)" />

      {/* Glow */}
      <Ellipse cx="200" cy="220" rx="155" ry="145" fill="#252540" opacity="0.6" />

      {/* Left ear */}
      <Circle cx="82" cy="110" r="62" fill="#1A1A2E" />
      <Circle cx="82" cy="110" r="36" fill="url(#logo-ear)" />

      {/* Right ear */}
      <Circle cx="318" cy="110" r="62" fill="#1A1A2E" />
      <Circle cx="318" cy="110" r="36" fill="url(#logo-ear)" />

      {/* Head */}
      <Circle cx="200" cy="220" r="158" fill="url(#logo-face)" />

      {/* Eye patches */}
      <Ellipse cx="138" cy="205" rx="68" ry="72" fill="url(#logo-patch-l)" rotation="-8" originX="138" originY="205" />
      <Ellipse cx="262" cy="205" rx="68" ry="72" fill="url(#logo-patch-r)" rotation="8" originX="262" originY="205" />

      {/* White sclera */}
      <Circle cx="138" cy="202" r="52" fill="white" />
      <Circle cx="262" cy="202" r="52" fill="white" />

      {/* Pupils */}
      <Circle cx="144" cy="208" r="30" fill="#12121F" />
      <Circle cx="256" cy="208" r="30" fill="#12121F" />

      {/* Eye shine */}
      <Circle cx="128" cy="192" r="11" fill="white" opacity="0.95" />
      <Circle cx="120" cy="207" r="5"  fill="white" opacity="0.6" />
      <Circle cx="252" cy="192" r="11" fill="white" opacity="0.95" />
      <Circle cx="244" cy="207" r="5"  fill="white" opacity="0.6" />

      {/* Nose */}
      <Ellipse cx="200" cy="272" rx="18" ry="12" fill="#1A1A2E" />

      {/* Cheeks */}
      <Ellipse cx="110" cy="268" rx="30" ry="16" fill="#FF8FAB" opacity="0.18" />
      <Ellipse cx="290" cy="268" rx="30" ry="16" fill="#FF8FAB" opacity="0.18" />

      {/* Mouth */}
      <Path
        d="M174 292 Q200 316 226 292"
        stroke="#1A1A2E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 克 brand mark */}
      <SvgText
        x="200"
        y="162"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill="#1A1A2E"
        opacity="0.12"
        fontFamily="serif"
      >
        克
      </SvgText>
    </Svg>
  );
}