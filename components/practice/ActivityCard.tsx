import { useAppTheme } from '@/lib/AppThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 20 * 2 - 12) / 2;

type Props = {
  color: string;
  icon: string;
  title: string;
  subtitle: string;
  locked?: boolean;
  tag?: string;
  onPress: () => void;
};

export default function ActivityCard({
  color,
  icon,
  title,
  subtitle,
  locked = false,
  tag,
  onPress,
}: Props) {
  const { palette, fonts } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.gridCard, locked && styles.gridCardLocked]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={locked}
    >
      <LinearGradient
        colors={[`${color}10`, palette.bgElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.activityStripe, { backgroundColor: color }]} />
      <Text style={styles.cardBgIcon}>{icon}</Text>

      <View style={styles.cardTopRow}>
        <View style={[styles.cardIconWrap, { borderColor: palette.borderStrong, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardIcon, { color: palette.text, fontFamily: fonts.mono }]}>{icon}</Text>
        </View>
        {tag ? (
          <View style={[styles.tag, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.tagText, { color: palette.textMuted, fontFamily: fonts.mono }]}>{tag}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: palette.text, fontFamily: fonts.mono }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: palette.textMuted, fontFamily: fonts.mono }]}>{subtitle}</Text>
      </View>

      {locked ? (
        <View style={[styles.lockBadge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.lockText, { color: palette.text, fontFamily: fonts.mono }]}>×</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 16,
  },
  gridCardLocked: {
    opacity: 0.5,
  },
  activityStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.82,
  },
  cardBgIcon: {
    position: 'absolute',
    bottom: -14,
    right: -6,
    fontSize: 100,
    color: 'rgba(255,255,255,0.05)',
    fontWeight: '900',
    lineHeight: 112,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  cardIconWrap: {
    minWidth: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 28,
    fontWeight: '700',
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    maxWidth: '85%',
  },
  lockBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
