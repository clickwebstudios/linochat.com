import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { getChats } from '@/lib/api/chats';
import { formatTimeAgo, truncate } from '@/lib/utils/formatting';
import type { Chat } from '@/lib/api/types';

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (err) {
      if (__DEV__) console.log('Chats fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Ionicons name="create-outline" size={24} color={Colors.primary} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} tintColor={Colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : chats.length === 0 ? (
          <Text style={styles.emptyText}>No conversations yet</Text>
        ) : (
          chats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatRow}>
              <View style={[styles.avatar, { backgroundColor: chat.status === 'active' ? Colors.primary : Colors.textMuted }]}>
                <Text style={styles.avatarText}>
                  {chat.customer_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatTopRow}>
                  <Text style={styles.chatName}>{chat.customer_name}</Text>
                  <Text style={styles.chatTime}>
                    {chat.last_message_at ? formatTimeAgo(chat.last_message_at) : ''}
                  </Text>
                </View>
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {chat.preview ? truncate(chat.preview, 50) : 'No messages'}
                </Text>
                {chat.agent_name && (
                  <Text style={styles.chatAgent}>
                    <Ionicons name="person-outline" size={11} color={Colors.textMuted} />{' '}
                    {chat.agent_name}
                  </Text>
                )}
              </View>
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{chat.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  chatTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  chatPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chatAgent: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
