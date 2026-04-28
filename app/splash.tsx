import Logo from '@/components/Logo';
import { useAppTheme } from '@/lib/AppThemeContext';
import { isOnboardingDone } from '@/lib/user';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { palette, fonts } = useAppTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const pulse = useRef(new Animated.Value(0.82)).current;
  const outro = useRef(new Animated.Value(1)).current;
  const styles = createStyles(palette, fonts);

  useEffect(() => {
    let mounted = true;

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(async () => {
      await new Promise((resolve) => setTimeout(resolve, 880));
      Animated.parallel([
        Animated.timing(outro, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.03, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(async () => {
        if (!mounted) return;
        const done = await isOnboardingDone();
        if (mounted) router.replace(done ? '/(tabs)' : '/onboarding');
      });
    });

    return () => {
      mounted = false;
    };
  }, [fade, lift, outro, pulse, router, scale]);

  return (
    <Animated.View style={[styles.container, { opacity: outro }]}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }, { scale }] }}>
        <View style={styles.stack}>
          <Animated.View
            style={[
              styles.logoAura,
              {
                borderColor: palette.borderStrong,
                backgroundColor: palette.surface,
                opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                transform: [{ scale: pulse }],
              },
            ]}
          />
          <View style={styles.logoWrap}>
            <Logo size={116} />
          </View>
          <Text style={styles.mark}>CLAIRO</Text>
          <Text style={styles.submark}>contextual language recall</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    stack: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
    },
    logoAura: {
      position: 'absolute',
      width: 216,
      height: 216,
      borderRadius: 108,
      borderWidth: 1,
    },
    logoWrap: {
      marginBottom: 18,
    },
    mark: {
      color: palette.text,
      fontFamily: fonts.mono,
      fontSize: 24,
      letterSpacing: 5,
      fontWeight: '700',
      textAlign: 'center',
    },
    submark: {
      marginTop: 10,
      color: palette.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
    },
  });
