import { AppPalette } from '@/constants/theme';
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

  return (
    <>
      <Text style={styles.bgChar}>{backgroundChar}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[`${accentColor}20`, AppPalette.bgElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.heroAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
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
    backgroundColor: AppPalette.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  backArrow: {
    color: AppPalette.text,
    fontSize: 18,
  },
  heroCard: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    borderWidth: 1,
    borderColor: AppPalette.border,
    marginBottom: 28,
    backgroundColor: AppPalette.bgElevated,
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: AppPalette.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: AppPalette.textMuted,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    color: AppPalette.textSoft,
    fontSize: 11,
    fontWeight: '700',
  },
});
