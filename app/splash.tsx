import { isOnboardingDone } from '@/lib/user';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    View,
} from 'react-native';
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

// ─── Bamboo ──────────────────────────────────────────────────────────────────
function Bamboo() {
  return (
    <View style={styles.bamboo}>
      {/* Stalk */}
      <View style={styles.bambooStalk}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.bambooSegmentWrapper}>
            <View style={styles.bambooSegment} />
            <View style={styles.bambooJoint} />
          </View>
        ))}
      </View>
      {/* Leaves */}
      <View style={[styles.bambooLeaf, { top: 20, left: 12, transform: [{ rotate: '30deg' }] }]} />
      <View style={[styles.bambooLeaf, { top: 60, left: -18, transform: [{ rotate: '-40deg' }] }]} />
      <View style={[styles.bambooLeaf, { top: 100, left: 14, transform: [{ rotate: '20deg' }] }]} />
    </View>
  );
}

// ─── Panda face ──────────────────────────────────────────────────────────────
function PandaFace() {
  return (
    <Svg width={260} height={260} viewBox="0 0 400 400">
      <Defs>
        <LinearGradient id="sp-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1C1C2E" />
          <Stop offset="100%" stopColor="#0D0D0D" />
        </LinearGradient>
        <LinearGradient id="sp-face" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F0F0F0" />
        </LinearGradient>
        <LinearGradient id="sp-ear" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#3A3A5C" />
          <Stop offset="100%" stopColor="#2A2A4A" />
        </LinearGradient>
        <LinearGradient id="sp-pl" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#1A1A2E" />
          <Stop offset="100%" stopColor="#12121F" />
        </LinearGradient>
        <LinearGradient id="sp-pr" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1A1A2E" />
          <Stop offset="100%" stopColor="#12121F" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="400" rx="90" fill="url(#sp-bg)" />
      <Ellipse cx="200" cy="220" rx="155" ry="145" fill="#252540" opacity="0.6" />
      <Circle cx="82"  cy="110" r="62" fill="#1A1A2E" />
      <Circle cx="82"  cy="110" r="36" fill="url(#sp-ear)" />
      <Circle cx="318" cy="110" r="62" fill="#1A1A2E" />
      <Circle cx="318" cy="110" r="36" fill="url(#sp-ear)" />
      <Circle cx="200" cy="220" r="158" fill="url(#sp-face)" />
      <Ellipse cx="138" cy="205" rx="68" ry="72" fill="url(#sp-pl)" rotation="-8" originX="138" originY="205" />
      <Ellipse cx="262" cy="205" rx="68" ry="72" fill="url(#sp-pr)" rotation="8"  originX="262" originY="205" />
      {/* Static left eye (open state) */}
      <Circle cx="138" cy="202" r="52" fill="white" />
      <Circle cx="144" cy="208" r="30" fill="#12121F" />
      <Circle cx="128" cy="192" r="11" fill="white" opacity="0.95" />
      <Circle cx="120" cy="207" r="5"  fill="white" opacity="0.6" />
      {/* Static right eye */}
      <Circle cx="262" cy="202" r="52" fill="white" />
      <Circle cx="256" cy="208" r="30" fill="#12121F" />
      <Circle cx="252" cy="192" r="11" fill="white" opacity="0.95" />
      <Circle cx="244" cy="207" r="5"  fill="white" opacity="0.6" />
      <Ellipse cx="200" cy="272" rx="18" ry="12" fill="#1A1A2E" />
      <Ellipse cx="110" cy="268" rx="30" ry="16" fill="#FF8FAB" opacity="0.18" />
      <Ellipse cx="290" cy="268" rx="30" ry="16" fill="#FF8FAB" opacity="0.18" />
      <Path d="M174 292 Q200 316 226 292" stroke="#1A1A2E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <SvgText x="200" y="162" textAnchor="middle" fontSize="26" fontWeight="900" fill="#1A1A2E" opacity="0.12" fontFamily="serif">克</SvgText>
    </Svg>
  );
}

// ─── Main splash screen ───────────────────────────────────────────────────────
export default function SplashScreen() {
  const router = useRouter();
  const winkPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  // Master animations
  const fadeIn       = useRef(new Animated.Value(0)).current;
  const pandaScale   = useRef(new Animated.Value(0.85)).current;
  const headTilt     = useRef(new Animated.Value(0)).current;    // rotate panda head
  const bambooSlide  = useRef(new Animated.Value(60)).current;   // bamboo slides in from right
  const bambooOpacity= useRef(new Animated.Value(0)).current;
  const bambooSway   = useRef(new Animated.Value(0)).current;
  const leftEyeBlink = useRef(new Animated.Value(0)).current;   // 0=open, 1=closed
  const particleBurst = useRef(new Animated.Value(0)).current;
  const screenFade   = useRef(new Animated.Value(1)).current;   // whole screen fades out

  // Derived: head rotation string
  const headRotate = headTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  // Natural blink: top and bottom lids meet in the middle.
  const upperLidHeight = leftEyeBlink.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 34],
  });
  const lowerLidHeight = leftEyeBlink.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 34],
  });
  const lidsOpacity = leftEyeBlink.interpolate({
    inputRange: [0, 0.08, 1],
    outputRange: [0, 0.9, 1],
  });
  const bambooRotate = bambooSway.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });

  useEffect(() => {
    let mounted = true;

    const runAnimation = (animation: Animated.CompositeAnimation) =>
      new Promise<void>((resolve) => animation.start(() => resolve()));

    const playWinkSound = () => {
      try {
        const player = winkPlayerRef.current;
        if (!player) return;
        player.seekTo(0).catch(() => {});
        player.play();
      } catch {
        // Sound is optional; keep splash smooth even if audio fails.
      }
    };

    const run = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'mixWithOthers',
        });
      } catch {}
      try {
        const player = createAudioPlayer('https://cdn.jsdelivr.net/gh/jshawl/AudioFX/sounds/click1.mp3', {
          downloadFirst: true,
          keepAudioSessionActive: true,
        });
        player.volume = 0.35;
        winkPlayerRef.current = player;
      } catch {}

      await runAnimation(
        Animated.parallel([
          Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(pandaScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        ])
      );

      await runAnimation(
        Animated.parallel([
          Animated.timing(bambooSlide, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(bambooOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ])
      );

      await runAnimation(
        Animated.sequence([
          Animated.timing(bambooSway, { toValue: 1, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bambooSway, { toValue: -1, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bambooSway, { toValue: 0, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );

      await runAnimation(
        Animated.timing(headTilt, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true })
      );

      playWinkSound();
      particleBurst.setValue(0);
      Animated.timing(particleBurst, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

      await runAnimation(
        Animated.sequence([
          Animated.timing(leftEyeBlink, { toValue: 1, duration: 115, useNativeDriver: false }),
          Animated.timing(leftEyeBlink, { toValue: 0, duration: 165, useNativeDriver: false }),
        ])
      );

      await runAnimation(
        Animated.timing(headTilt, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true })
      );

      await runAnimation(
        Animated.parallel([
          Animated.timing(bambooSlide, { toValue: 60, duration: 180, useNativeDriver: true }),
          Animated.timing(bambooOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        ])
      );

      await runAnimation(Animated.delay(100));
      await runAnimation(Animated.timing(screenFade, { toValue: 0, duration: 280, useNativeDriver: true }));
      if (!mounted) return;
      const done = await isOnboardingDone();
      if (mounted) router.replace(done ? '/(tabs)' : '/onboarding');
    };

    run();
    return () => {
      mounted = false;
      try {
        winkPlayerRef.current?.remove();
      } catch {}
      winkPlayerRef.current = null;
    };
  }, [bambooOpacity, bambooSlide, bambooSway, fadeIn, headTilt, leftEyeBlink, pandaScale, particleBurst, router, screenFade]);

  const PARTICLES = [
    { dx: -20, dy: -20, size: 4, delay: 0 },
    { dx: 18, dy: -16, size: 3, delay: 20 },
    { dx: 24, dy: 6, size: 4, delay: 45 },
    { dx: -22, dy: 8, size: 3, delay: 30 },
    { dx: -10, dy: 22, size: 2, delay: 60 },
    { dx: 14, dy: 20, size: 2, delay: 55 },
  ] as const;

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      {/* Panda — appears with fade + scale */}
      <Animated.View
        style={[
          styles.pandaWrapper,
          {
            opacity: fadeIn,
            transform: [{ scale: pandaScale }],
          },
        ]}
      >
        {/* Head tilts as one unit */}
        <Animated.View style={{ transform: [{ rotate: headRotate }] }}>
          <PandaFace />

          {/* Left eye lids — animated wink */}
          <Animated.View style={[styles.leftEyeMask, { opacity: lidsOpacity }]}>
            <Animated.View style={[styles.leftEyeUpperLid, { height: upperLidHeight }]} />
            <Animated.View style={[styles.leftEyeLowerLid, { height: lowerLidHeight }]} />
          </Animated.View>

          <View pointerEvents="none" style={styles.particleAnchor}>
            {PARTICLES.map((p, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    width: p.size,
                    height: p.size,
                    borderRadius: p.size / 2,
                    opacity: particleBurst.interpolate({
                      inputRange: [0, 0.15, 1],
                      outputRange: [0, 0.85, 0],
                    }),
                    transform: [
                      {
                        translateX: particleBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.dx],
                        }),
                      },
                      {
                        translateY: particleBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.dy],
                        }),
                      },
                      {
                        scale: particleBurst.interpolate({
                          inputRange: [0, 0.2, 1],
                          outputRange: [0.4, 1, 0.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Bamboo — slides in from right */}
      <Animated.View
        style={[
          styles.bambooWrapper,
          {
            opacity: bambooOpacity,
            transform: [{ translateX: bambooSlide }, { rotate: bambooRotate }],
          },
        ]}
      >
        <Bamboo />
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: fadeIn }]}>
        clairo
      </Animated.Text>
      <Animated.Text style={[styles.appSubName, { opacity: fadeIn }]}>
        chinese studio
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pandaWrapper: {
    marginBottom: 8,
  },

  // Left eye blink mask (over left eye only)
  leftEyeMask: {
    position: 'absolute',
    // Positioned over the left eye sclera in the 260x260 SVG
    // Left eye center in SVG viewBox: cx=138, cy=202, r=52
    // Scale to rendered size: 260/400 = 0.65
    left:  260 * (138 - 52) / 400,   // ≈ 56
    top:   260 * (202 - 52) / 400,   // ≈ 97
    width: 260 * 104 / 400,          // ≈ 67  (diameter = 2*r)
    height:260 * 104 / 400,          // ≈ 67
    borderRadius: 999,
    overflow: 'hidden',
  },
  leftEyeUpperLid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#1A1A2E',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  leftEyeLowerLid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  particleAnchor: {
    position: 'absolute',
    left: 260 * 138 / 400,
    top: 260 * 202 / 400,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#F8FAFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },

  // Bamboo
  bambooWrapper: {
    position: 'absolute',
    right: 60,
    top: '28%',
  },
  bamboo: {
    alignItems: 'center',
    width: 32,
  },
  bambooStalk: {
    alignItems: 'center',
    gap: 0,
  },
  bambooSegmentWrapper: {
    alignItems: 'center',
  },
  bambooSegment: {
    width: 14,
    height: 32,
    backgroundColor: '#4A7C59',
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: '#67A879',
    borderRightColor: '#355E43',
    borderRadius: 2,
  },
  bambooJoint: {
    width: 18,
    height: 5,
    backgroundColor: '#3A6347',
    borderRadius: 2,
    marginVertical: 1,
  },
  bambooLeaf: {
    position: 'absolute',
    width: 28,
    height: 10,
    backgroundColor: '#5A9A6A',
    borderTopWidth: 1,
    borderTopColor: '#77BD89',
    borderRadius: 10,
  },

  // App name
  appName: {
    marginTop: 20,
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    opacity: 0.96,
    textTransform: 'lowercase',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  appSubName: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },
});