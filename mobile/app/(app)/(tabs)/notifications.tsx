import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { API_BASE_URL, getAccessToken } from '@/lib/api/client';
import { addNotificationListener } from '@/lib/notifications';

interface AppNotification {
  id: number;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  alert: { name: 'alert-circle', color: '#F59E0B' },
  security: { name: 'shield', color: '#EF4444' },
  user: { name: 'chatbubble-ellipses', color: '#3B82F6' },
  billing: { name: 'card', color: '#6B7280' },
  system: { name: 'information-circle', color: '#9CA3AF' },
  success: { name: 'checkmark-circle', color: '#22C55E' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh when a push notification arrives while screen is open
    const cleanup = addNotificationListener(() => fetchNotifications());
    return cleanup;
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = ICON_MAP[item.type] || ICON_MAP.system;
    const timeAgo = getTimeAgo(item.created_at);

    return (
      <View style={[styles.item, !item.is_read && styles.unreadItem]}>
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, !item.is_read && styles.unreadText]}>{item.title}</Text>
          {item.description ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text> : null}
          <Text style={styles.itemTime}>{timeAgo}</Text>
        </View>
        {!item.is_read && <View style={styles.dot} />}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Notifications</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

function getTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, paddingVertical: 12 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F3F4F6' },
  markAllText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  unreadItem: { backgroundColor: '#F0F7FF' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '500', color: Colors.text },
  unreadText: { fontWeight: '700' },
  itemDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  itemTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted },
});
