import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.emptyState}>
        <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySubtitle}>You're all caught up!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
