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
  accentColor,
  badges,
}: Props) {
  const router = useRouter();
  const { palette, fonts } = useAppTheme();

  return (
    <>
      <Text style={styles.bgChar}>{backgroundChar}</Text>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}>
        <Text style={[styles.backArrow, { color: palette.text, fontFamily: fonts.rounded }]}>←</Text>
      </TouchableOpacity>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[accentColor, palette.tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[styles.heroTitle, { fontFamily: fonts.rounded }]}>{title}</Text>
        {subtitle ? <Text style={[styles.heroSubtitle, { fontFamily: fonts.sans }]}>{subtitle}</Text> : null}
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge} style={styles.badge}>
              <Text style={[styles.badgeText, { fontFamily: fonts.rounded }]}>{badge}</Text>
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
    color: 'rgba(127,127,127,0.08)',
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
    marginBottom: 28,
    shadowColor: '#122033',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    maxWidth: '92%',
    color: 'rgba(255,255,255,0.84)',
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
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.26)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
