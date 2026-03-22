import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { useAuthStore } from '@/lib/stores/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.white,
          height: 85,
          paddingBottom: 30,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
          href: isSuperadmin ? '/(app)/(tabs)/companies' : null,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          href: !isSuperadmin ? '/(app)/(tabs)/chats' : null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
