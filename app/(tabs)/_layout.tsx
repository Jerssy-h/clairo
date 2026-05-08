import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';

export default function TabLayout() {
  const { mode, palette, fonts } = useAppTheme();
  const { language } = useLanguage();

  // Оптимизация по Фейнману: вычисляем только при смене языка
  const labels = useMemo(() => ({
    home: language === 'ru' ? 'Главная' : 'Home',
    topics: language === 'ru' ? 'Темы' : 'Topics',
  }), [language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[mode].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: palette.bgElevated,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 82,
          paddingTop: 12,
          paddingBottom: 12,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 28,
          position: 'absolute',
          shadowColor: '#122033',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: mode === 'dark' ? 0.28 : 0.13,
          shadowRadius: 18,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.rounded,
          fontSize: 11,
          fontWeight: '900',
        },
        tabBarInactiveTintColor: palette.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="book.closed.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: labels.topics,
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="rectangle.stack.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
