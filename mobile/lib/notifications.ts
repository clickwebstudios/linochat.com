import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_BASE_URL, getAccessToken } from './api/client';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and send token to backend.
 * Call this after user logs in.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('Push notification permission not granted');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
    });
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'linochat', // matches app.json slug
    });
    const pushToken = tokenData.data;

    // Register token with backend
    await sendTokenToBackend(pushToken);

    return pushToken;
  } catch (error) {
    if (__DEV__) console.log('Failed to get push token:', error);
    return null;
  }
}

/**
 * Send push token to the backend for storage.
 */
async function sendTokenToBackend(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  try {
    await fetch(`${API_BASE_URL}/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
    });
  } catch (error) {
    if (__DEV__) console.log('Failed to register push token:', error);
  }
}

/**
 * Unregister push token (call on logout).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'linochat',
    });
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    await fetch(`${API_BASE_URL}/devices/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch {
    // Silently fail — user is logging out anyway
  }
}

/**
 * Add a listener for incoming notifications (foreground).
 * Returns a cleanup function.
 */
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add a listener for notification taps (opens app from notification).
 * Returns a cleanup function.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}
