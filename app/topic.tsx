import { AppPalette } from '@/constants/theme';
import { getCache, setCache } from '@/lib/cache';
import { useLanguage } from '@/lib/LanguageContext';
import { pushRecentTopic } from '@/lib/recent-topics';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = (width - 20 * 2 - 12) / 2;

// смешивание цветов
const blendHex = (hex: string, target: string, amount: number) => {
  const normalize = (value: string) => {
    const raw = value.replace('#', '');
    return raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  };
  const source = normalize(hex);
  const blend = normalize(target);
  const mix = (s: number, e: number) => Math.round(s + (e - s) * amount);

  const r = mix(parseInt(source.slice(0, 2), 16), parseInt(blend.slice(0, 2), 16));
  const g = mix(parseInt(source.slice(2, 4), 16), parseInt(blend.slice(2, 4), 16));
  const b = mix(parseInt(source.slice(4, 6), 16), parseInt(blend.slice(4, 6), 16));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

// hue shift (главная магия)
const shiftHue = (hex: string, degree: number) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = (h * 360 + degree) % 360;
  h /= 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r1, g1, b1;

  if (s === 0) {
    r1 = g1 = b1 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1/3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
};

export default function TopicScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#4F46E5';

  const cacheKey = `word_count_${topicId}`;
  const [wordCount, setWordCount] = useState<number>(getCache<number>(cacheKey) ?? 0);
  const [loading, setLoading] = useState(getCache<number>(cacheKey) === null);

  useEffect(() => {
    pushRecentTopic(String(topicId));

    const cached = getCache<number>(cacheKey);
    if (cached !== null) {
      setWordCount(cached);
      setLoading(false);

      supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)
        .then(({ count }) => {
          if (count !== null) {
            setWordCount(count);
            setCache(cacheKey, count);
          }
        });
      return;
    }

    supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .then(({ count }) => {
        const n = count || 0;
        setWordCount(n);
        setCache(cacheKey, n);
        setLoading(false);
      });
  }, [cacheKey, topicId]);

  // 🎨 Цветовая система
  const activities = [
    {
      id: 'flashcard',
      title: t.flashcards,
      subtitle: language === 'ru' ? 'Узнавание' : 'Recognition',
      icon: '卡',
      color: color,
      minWords: 1,
    },
    {
      id: 'quiz',
      title: t.quiz,
      subtitle: language === 'ru' ? 'Проверка' : 'Testing',
      icon: '测',
      color: shiftHue(color, 25),
      minWords: 4,
    },
    {
      id: 'sentence',
      title: t.sentenceBuilder,
      subtitle: language === 'ru' ? 'Составление' : 'Production',
      icon: '句',
      color: shiftHue(color, 180),
      minWords: 1,
    },
    {
      id: 'stroke',
      title: language === 'ru' ? 'Пропись' : 'Strokes',
      subtitle: language === 'ru' ? 'Написание' : 'Writing',
      icon: '笔',
      color: shiftHue(color, 120),
      minWords: 1,
    },
  ];

  const handleActivity = (activityId: string, minWords: number) => {
    if (wordCount < minWords) {
      alert(activityId === 'quiz' ? t.add4Words : t.addWordsFromAdmin);
      return;
    }
    const params = { topicId, topicTitle, topicColor };

    if (activityId === 'flashcard') router.push({ pathname: '/flashcard', params });
    else if (activityId === 'quiz') router.push({ pathname: '/quiz', params });
    else if (activityId === 'sentence') router.push({ pathname: '/sentence', params });
    else if (activityId === 'stroke') router.push({ pathname: '/stroke', params });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[color + 'CC', color + '30', AppPalette.bg, AppPalette.bg]}
        style={StyleSheet.absoluteFillObject}
      />

      <Text style={styles.bgChar}>{(topicTitle as string)?.[0] || '中'}</Text>

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{topicTitle}</Text>

        <View style={styles.heroMeta}>
          <View style={[styles.metaBadge, { backgroundColor: color + '33' }]}>
            <Text style={styles.metaBadgeText}>
              {loading ? '...' : `${wordCount} ${t.words}`}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t.chooseActivity}</Text>

      <View style={styles.grid}>
        {activities.map((activity) => {
          const locked = wordCount < activity.minWords;

          const base = blendHex(activity.color, '#ffffff', 0.2);
          const deep = blendHex(activity.color, '#000000', 0.4);

          const activityBase = blendHex(base, AppPalette.bgElevated, 0.2);
          const activityShade = blendHex(deep, AppPalette.bg, 0.6);

          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.gridCard, { opacity: locked ? 0.4 : 1 }]}
              onPress={() => handleActivity(activity.id, activity.minWords)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[activityBase, activityShade]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <Text style={styles.cardBgIcon}>{activity.icon}</Text>

              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>{activity.icon}</Text>
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
              </View>

              {locked && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg, paddingHorizontal: 20, paddingTop: 60 },

  bgChar: {
    position: 'absolute',
    fontSize: 300,
    color: 'rgba(255,255,255,0.05)',
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
    marginBottom: 28,
  },

  backArrow: { color: AppPalette.text, fontSize: 18 },

  hero: { marginBottom: 32 },

  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: AppPalette.text,
    letterSpacing: -1,
    marginBottom: 10,
  },

  heroMeta: { flexDirection: 'row' },

  metaBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },

  metaBadgeText: {
    color: AppPalette.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppPalette.textFaint,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },

  cardBgIcon: {
    position: 'absolute',
    bottom: -16,
    right: -8,
    fontSize: 96,
    color: 'rgba(255,255,255,0.12)',
    fontWeight: '900',
    lineHeight: 110,
  },

  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
    gap: 4,
  },

  cardIcon: {
    fontSize: 40,
    fontWeight: '900',
    color: AppPalette.text,
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppPalette.text,
    letterSpacing: -0.3,
  },

  cardSubtitle: {
    fontSize: 12,
    color: AppPalette.textSoft,
    fontWeight: '500',
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,16,32,0.4)',
  },

  lockIcon: {
    fontSize: 22,
  },
});