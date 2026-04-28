import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import * as Updates from 'expo-updates';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export function UpdateChecker() {
  const { palette, fonts } = useAppTheme();
  const { language } = useLanguage();

  const copy = language === 'ru'
    ? {
        title: 'Проверить обновления',
        availableTitle: 'Доступно обновление',
        availableBody: 'Установить новую версию сейчас?',
        later: 'Позже',
        install: 'Установить',
        latestTitle: 'Актуальная версия',
        latestBody: 'У вас уже последняя версия.',
        errorTitle: 'Ошибка',
        errorBody: 'Не удалось проверить обновления.',
      }
    : {
        title: 'Check updates',
        availableTitle: 'Update available',
        availableBody: 'Install the latest version now?',
        later: 'Later',
        install: 'Install',
        latestTitle: 'Up to date',
        latestBody: 'You already have the latest version.',
        errorTitle: 'Error',
        errorBody: 'Could not check for updates.',
      };

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(copy.availableTitle, copy.availableBody, [
          { text: copy.later, style: 'cancel' },
          {
            text: copy.install,
            onPress: async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            },
          },
        ]);
      } else {
        Alert.alert(copy.latestTitle, copy.latestBody);
      }
    } catch {
      Alert.alert(copy.errorTitle, copy.errorBody);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]} onPress={checkForUpdates} activeOpacity={0.82}>
      <Text style={[styles.text, { color: palette.textMuted, fontFamily: fonts.mono }]}>{copy.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
