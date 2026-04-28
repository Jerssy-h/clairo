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
  const lift = useRef(new Animated.Value(12)).current;
  const outro = useRef(new Animated.Value(1)).current;
  const styles = createStyles(palette, fonts);

  useEffect(() => {
    let mounted = true;

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(async () => {
      await new Promise((resolve) => setTimeout(resolve, 950));
      Animated.timing(outro, { toValue: 0, duration: 260, useNativeDriver: true }).start(async () => {
        if (!mounted) return;
        const done = await isOnboardingDone();
        if (mounted) router.replace(done ? '/(tabs)' : '/onboarding');
      });
    });

    return () => {
      mounted = false;
    };
  }, [fade, lift, outro, router]);

  return (
    <Animated.View style={[styles.container, { opacity: outro }]}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
        <View style={styles.stack}>
          <Logo size={112} />
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
    },
    mark: {
      marginTop: 22,
      color: palette.text,
      fontFamily: fonts.mono,
      fontSize: 24,
      letterSpacing: 5,
      fontWeight: '700',
    },
    submark: {
      marginTop: 12,
      color: palette.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
    },
  });
