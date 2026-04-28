import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThemeMode, appPalettes, darkPalette, Fonts } from '@/constants/theme';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AppThemeContextType = {
  mode: AppThemeMode;
  palette: typeof darkPalette;
  fonts: typeof Fonts;
  navTheme: Theme;
  isDark: boolean;
  toggleMode: () => void;
  setMode: (mode: AppThemeMode) => void;
};

const STORAGE_KEY = 'app-theme-mode';

const AppThemeContext = createContext<AppThemeContextType>({
  mode: 'dark',
  palette: appPalettes.dark,
  fonts: Fonts,
  navTheme: DarkTheme,
  isDark: true,
  toggleMode: () => {},
  setMode: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored);
    });
  }, []);

  const setMode = useCallback((nextMode: AppThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(() => {
    const palette = appPalettes[mode];
    const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
    const navTheme: Theme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: palette.bg,
        card: palette.bgElevated,
        border: palette.border,
        text: palette.text,
        primary: palette.text,
        notification: palette.text,
      },
    };

    return {
      mode,
      palette,
      fonts: Fonts,
      navTheme,
      isDark: mode === 'dark',
      toggleMode,
      setMode,
    };
  }, [mode, setMode, toggleMode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export const useAppTheme = () => useContext(AppThemeContext);
