import { useAppTheme } from '@/lib/AppThemeContext';
import { isOnboardingDone } from '@/lib/user';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

const panda = require('@/assets/images/clairo_panda_v2.png');

export default function SplashScreen() {
  const router = useRouter();
  const { palette, fonts } = useAppTheme();
  const outro = useRef(new Animated.Value(1)).current;
  const styles = createStyles(palette, fonts);

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(() => {
      Animated.timing(outro, { toValue: 0, duration: 360, useNativeDriver: true }).start(async () => {
        if (!mounted) return;
        const done = await isOnboardingDone();
        if (mounted) router.replace(done ? '/(tabs)' : '/onboarding');
      });
    }, 950);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [outro, router]);

  return (
    <Animated.View style={[styles.container, { opacity: outro }]}>
      <Image source={panda} style={styles.panda} resizeMode="contain" />
      <Text style={styles.mark}>CLAIRO</Text>
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
    panda: {
      width: 156,
      height: 156,
      marginBottom: 18,
    },
    mark: {
      color: palette.text,
      fontFamily: fonts.serif,
      fontSize: 34,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
