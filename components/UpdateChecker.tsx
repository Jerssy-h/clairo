import * as Updates from 'expo-updates';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export function UpdateChecker() {
  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          '🎉 Новая версия!',
          'Доступно обновление. Установить сейчас?',
          [
            { text: 'Позже', style: 'cancel' },
            {
              text: 'Установить',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        Alert.alert('✅ Всё актуально', 'У вас последняя версия.');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось проверить обновления.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={checkForUpdates}>
      <Text style={styles.text}>Проверить обновления</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    backgroundColor: '#1DB954',
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});