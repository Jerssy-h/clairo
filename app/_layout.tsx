import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/lib/LanguageContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const activityScreenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    gestureDirection: 'horizontal' as const,
    animationDuration: 240,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="splash"      options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
            <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
            <Stack.Screen name="topic"       options={activityScreenOptions} />
            <Stack.Screen name="flashcard"   options={activityScreenOptions} />
            <Stack.Screen name="quiz"        options={activityScreenOptions} />
            <Stack.Screen name="sentence"    options={activityScreenOptions} />
            <Stack.Screen name="stroke"      options={activityScreenOptions} />
            <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}