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
        colors={[color, palette.tint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.cardBgIcon}>{icon}</Text>

      <View style={styles.cardTopRow}>
        <View style={styles.cardIconWrap}>
          <Text style={[styles.cardIcon, { fontFamily: fonts.rounded }]}>{icon}</Text>
        </View>
        {tag ? (
          <View style={styles.tag}>
            <Text style={[styles.tagText, { fontFamily: fonts.rounded }]}>{tag}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { fontFamily: fonts.rounded }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { fontFamily: fonts.sans }]}>{subtitle}</Text>
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
    backgroundColor: '#19A7CE',
    padding: 16,
    shadowColor: '#122033',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  gridCardLocked: {
    opacity: 0.5,
  },
  cardBgIcon: {
    position: 'absolute',
    bottom: -14,
    right: -6,
    fontSize: 100,
    color: 'rgba(255,255,255,0.16)',
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
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    maxWidth: '85%',
    color: 'rgba(255,255,255,0.82)',
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
