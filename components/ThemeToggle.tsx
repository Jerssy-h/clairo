import { useAppTheme } from '@/lib/AppThemeContext';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function ThemeToggle() {
  const { mode, toggleMode, palette, fonts } = useAppTheme();

  return (
    <TouchableOpacity style={[styles.trigger, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]} onPress={toggleMode} activeOpacity={0.8}>
      <Text style={[styles.label, { color: palette.text, fontFamily: fonts.mono }]}>
        {mode === 'dark' ? '◐ LIGHT' : '◑ DARK'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
});
