import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '@/lib/notifications';

export default function AppLayout() {
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications when app is authenticated
    registerForPushNotifications();

    // Handle notification taps (navigate to relevant screen)
    const cleanup = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'user' || data?.type === 'alert') {
        router.push('/(app)/(tabs)/notifications');
      }
    });

    return cleanup;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="company/[id]" />
    </Stack>
  );
}
