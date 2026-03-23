import { AppPalette } from '@/constants/theme';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/lib/i18n';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

// ── SVG Flags ────────────────────────────────────────────────────────────────

const FlagRU = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size * (2 / 3)} viewBox="0 0 900 600">
    <Defs>
      <ClipPath id="ru-clip">
        <Rect width="900" height="600" rx="4" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#ru-clip)">
      <Rect width="900" height="200" fill="#FFFFFF" />
      <Rect y="200" width="900" height="200" fill="#0039A6" />
      <Rect y="400" width="900" height="200" fill="#D52B1E" />
    </G>
  </Svg>
);

const FlagGB = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size * (2 / 3)} viewBox="0 0 60 40">
    <Defs>
      <ClipPath id="gb-clip">
        <Rect width="60" height="40" rx="3" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#gb-clip)">
      {/* Blue background */}
      <Rect width="60" height="40" fill="#012169" />
      {/* White diagonals */}
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      {/* Red diagonals */}
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5" />
      {/* White cross */}
      <Path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="13" />
      {/* Red cross */}
      <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
    </G>
  </Svg>
);

// ── Language options ──────────────────────────────────────────────────────────

type LangOption = {
  code: Language;
  label: string;
  sublabel: string;
  Flag: React.FC<{ size?: number }>;
};

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English', sublabel: 'Interface in English', Flag: FlagGB },
  { code: 'ru', label: 'Русский', sublabel: 'Интерфейс на русском', Flag: FlagRU },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LanguagePicker() {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const openSheet = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      callback?.();
    });
  };

  const select = (code: Language) => {
    closeSheet(() => changeLanguage(code));
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity style={styles.trigger} onPress={openSheet} activeOpacity={0.75}>
        <current.Flag size={20} />
        <Text style={styles.triggerLabel}>{current.code.toUpperCase()}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {/* Bottom sheet modal */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => closeSheet()}>
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Language / Язык</Text>

          {LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, isActive && styles.langRowActive]}
                onPress={() => select(lang.code)}
                activeOpacity={0.75}>
                <View style={styles.flagWrap}>
                  <lang.Flag size={32} />
                </View>
                <View style={styles.langInfo}>
                  <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>{lang.label}</Text>
                  <Text style={styles.langSublabel}>{lang.sublabel}</Text>
                </View>
                {isActive && (
                  <View style={styles.checkWrap}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppPalette.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppPalette.borderStrong,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: AppPalette.text,
    letterSpacing: 1,
  },
  chevron: {
    fontSize: 10,
    color: AppPalette.textMuted,
    marginTop: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppPalette.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppPalette.bgElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: AppPalette.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppPalette.borderStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppPalette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 8,
    backgroundColor: AppPalette.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langRowActive: {
    borderColor: AppPalette.tint,
    backgroundColor: `${AppPalette.tint}18`,
  },
  flagWrap: {
    width: 40,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppPalette.surfaceSoft,
  },
  langInfo: { flex: 1 },
  langLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: AppPalette.textMuted,
    marginBottom: 2,
  },
  langLabelActive: {
    color: AppPalette.text,
  },
  langSublabel: {
    fontSize: 12,
    color: AppPalette.textFaint,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppPalette.tintStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: AppPalette.white,
    fontSize: 13,
    fontWeight: '800',
  },
});