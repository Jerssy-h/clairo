import { useAppTheme } from '@/lib/AppThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

type Props = {
  title: string;
  subtitle?: string;
  backgroundChar: string;
  accentColor: string;
  badges: string[];
};

export default function PracticeHero({
  title,
  subtitle,
  backgroundChar,
  accentColor: _accentColor,
  badges,
}: Props) {
  const router = useRouter();
  const { palette, fonts } = useAppTheme();

  return (
    <>
      <Text style={styles.bgChar}>{backgroundChar}</Text>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}>
        <Text style={[styles.backArrow, { color: palette.text, fontFamily: fonts.mono }]}>←</Text>
      </TouchableOpacity>

      <View style={[styles.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}>
        <LinearGradient
          colors={[palette.bgElevated, palette.bgElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[styles.heroTitle, { color: palette.text, fontFamily: fonts.mono }]}>{title}</Text>
        {subtitle ? <Text style={[styles.heroSubtitle, { color: palette.textMuted, fontFamily: fonts.mono }]}>{subtitle}</Text> : null}
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge} style={[styles.badge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.badgeText, { color: palette.textSoft, fontFamily: fonts.mono }]}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bgChar: {
    position: 'absolute',
    fontSize: 300,
    color: 'rgba(255,255,255,0.03)',
    fontWeight: '900',
    top: height * 0.04,
    alignSelf: 'center',
    lineHeight: 320,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  backArrow: {
    fontSize: 18,
  },
  heroCard: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    borderWidth: 1,
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    maxWidth: '92%',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
