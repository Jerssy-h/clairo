import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppTheme } from '@/lib/AppThemeContext';
import { markOnboardingDone, setUsername, syncUsernameToSupabase } from '@/lib/user';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const { palette, fonts } = useAppTheme();
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const styles = createStyles(palette, fonts);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      shake();
      return;
    }
    const trimmed = name.trim();
    await setUsername(trimmed);
    await markOnboardingDone();
    syncUsernameToSupabase(trimmed);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topBar}>
        <ThemeToggle />
      </View>

      <View style={styles.content}>
        <Logo size={120} />
        <Text style={styles.headline}>CLAIRO</Text>
        <Text style={styles.subheadline}>
          Calm, minimal Chinese practice.{'\n'}Start with your name.
        </Text>

        <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            placeholder="your name"
            placeholderTextColor={palette.textFaint}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            maxLength={30}
          />
        </Animated.View>

        <TouchableOpacity style={[styles.btn, !name.trim() && styles.btnDisabled]} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.btnText}>ENTER</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.bg,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    topBar: {
      position: 'absolute',
      top: 54,
      right: 20,
    },
    content: {
      alignItems: 'center',
    },
    headline: {
      marginTop: 22,
      fontSize: 26,
      color: palette.text,
      fontFamily: fonts.mono,
      letterSpacing: 4,
      fontWeight: '700',
    },
    subheadline: {
      marginTop: 18,
      fontSize: 13,
      lineHeight: 24,
      color: palette.textMuted,
      textAlign: 'center',
      fontFamily: fonts.mono,
    },
    inputWrapper: { width: '100%', marginTop: 34, marginBottom: 14 },
    input: {
      backgroundColor: palette.bgElevated,
      borderRadius: 22,
      paddingHorizontal: 22,
      paddingVertical: 18,
      fontSize: 17,
      color: palette.text,
      fontFamily: fonts.mono,
      borderWidth: 1,
      borderColor: palette.border,
    },
    inputFocused: {
      borderColor: palette.borderStrong,
    },
    btn: {
      width: '100%',
      backgroundColor: palette.text,
      borderRadius: 999,
      paddingVertical: 18,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: palette.bg, fontSize: 13, fontWeight: '700', letterSpacing: 2, fontFamily: fonts.mono },
  });
