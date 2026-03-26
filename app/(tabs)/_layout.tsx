import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppPalette, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/lib/LanguageContext';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { language } = useLanguage();

  // Оптимизация по Фейнману: вычисляем только при смене языка
  const labels = useMemo(() => ({
    home: language === 'ru' ? 'Главная' : 'Home',
    topics: language === 'ru' ? 'Темы' : 'Topics',
  }), [language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: AppPalette.bgElevated,
          borderTopColor: AppPalette.border,
          height: 66,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          // ФИКС: Явно указываем, что color — это string
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: labels.topics,
          // ФИКС: Явно указываем тип
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />
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