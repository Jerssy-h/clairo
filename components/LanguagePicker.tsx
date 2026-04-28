import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/lib/i18n';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type LangOption = {
  code: Language;
  label: string;
};

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

export default function LanguagePicker() {
  const { language, changeLanguage } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const [open, setOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const openSheet = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 150, useNativeDriver: true }),
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
      <TouchableOpacity
        style={[styles.trigger, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}
        onPress={openSheet}
        activeOpacity={0.82}
      >
        <Text style={[styles.triggerLabel, { color: palette.textSoft, fontFamily: fonts.mono }]}>
          {language.toUpperCase()}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => closeSheet()}>
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View style={[styles.overlay, { backgroundColor: palette.overlay, opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalCard,
            {
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderStrong,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: palette.textMuted, fontFamily: fonts.mono }]}>LANGUAGE</Text>
          <View style={styles.row}>
            {LANGUAGES.map((lang, index) => {
              const active = lang.code === language;
              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageChip,
                    {
                      backgroundColor: active ? palette.text : palette.bg,
                      borderColor: active ? palette.text : palette.border,
                      marginRight: index === LANGUAGES.length - 1 ? 0 : 8,
                    },
                  ]}
                  onPress={() => select(lang.code)}
                >
                  <Text style={[styles.languageChipText, { color: active ? palette.bg : palette.text, fontFamily: fonts.mono }]}>
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  triggerLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    position: 'absolute',
    top: 86,
    right: 20,
    minWidth: 190,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  modalTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  languageChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
