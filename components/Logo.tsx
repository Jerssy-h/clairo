import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function Logo({ size = 48 }: { size?: number }) {
  const radius = size * 0.28;
  return (
    <LinearGradient
      colors={['#6EE7F7', '#5B6CF9', '#9B59F5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.outer, { width: size, height: size, borderRadius: radius }]}
    >
      {/* Inner dark inset */}
      <View style={[styles.inner, {
        width: size * 0.72,
        height: size * 0.72,
        borderRadius: radius * 0.75,
      }]}>
        {/* C letter */}
        <Text style={[styles.letter, { fontSize: size * 0.36 }]}>C</Text>
        {/* Chinese accent */}
        <View style={[styles.dot, { backgroundColor: '#6EE7F7', width: size * 0.08, height: size * 0.08, borderRadius: size * 0.04 }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: '#0D0D0F',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  dot: {
    marginTop: 8,
  },
});