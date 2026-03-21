import Logo from '@/components/Logo';
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
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = async () => {
    if (!name.trim()) { shake(); return; }
    const trimmed = name.trim();
    await setUsername(trimmed);
    await syncUsernameToSupabase(trimmed);
    await markOnboardingDone();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.bgGlow} />

      <View style={styles.content}>
        {/* Panda logo — big, centered */}
        <View style={styles.avatarWrapper}>
          <Logo size={160} />
        </View>

        <Text style={styles.headline}>你好!</Text>
        <Text style={styles.subheadline}>
          Как тебя зовут?{'\n'}Мы будем учиться вместе
        </Text>

        <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            placeholder="Твоё имя"
            placeholderTextColor="#333"
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

        <TouchableOpacity
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Начать обучение →</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Имя можно будет изменить в настройках</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#4F46E5',
    opacity: 0.06,
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 28,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 16,
  },
  headline: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -1,
  },
  subheadline: {
    fontSize: 17,
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  inputWrapper: { width: '100%', marginBottom: 14 },
  input: {
    backgroundColor: '#131313',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  inputFocused: {
    borderColor: '#4F46E5',
    backgroundColor: '#131320',
  },
  btn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  btnDisabled: { backgroundColor: '#1A1A1A' },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  hint: { fontSize: 12, color: '#2A2A2A', textAlign: 'center' },
});