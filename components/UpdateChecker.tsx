import { AppPalette } from '@/constants/theme';
import * as Updates from 'expo-updates';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export function UpdateChecker() {
  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert('🎉 Новая версия!', 'Доступно обновление. Установить сейчас?', [
          { text: 'Позже', style: 'cancel' },
          {
            text: 'Установить',
            onPress: async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            },
          },
        ]);
      } else {
        Alert.alert('✅ Всё актуально', 'У вас последняя версия.');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось проверить обновления.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={checkForUpdates}>
      <Text style={styles.text}>upd.checker</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    backgroundColor: AppPalette.surface,
    borderRadius: 14,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  text: {
    color: AppPalette.textSoft,
    fontWeight: '700',
    fontSize: 14,
  },
});
