import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/lib/stores/authStore';
import { Colors } from '@/lib/utils/colors';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/(app)/(tabs)/dashboard');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
