import { Alert, Platform } from 'react-native';

// Alert.alert is a no-op on react-native-web, so fall back to the browser
// dialogs there. On Android and iOS the native Alert is used.
export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAlert(title, message, onConfirm, confirmText = 'OK') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
