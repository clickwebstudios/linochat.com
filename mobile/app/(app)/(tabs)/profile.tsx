import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { useAuthStore } from '@/lib/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { unregisterPushNotifications } from '@/lib/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const doLogout = async () => {
    try {
      await unregisterPushNotifications();
      await logout();
    } catch (e) {
      if (__DEV__) console.log('Logout error:', e);
    }
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  const roleVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'admin': return 'info';
      case 'agent': return 'success';
      default: return 'default';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Avatar
            firstName={user?.first_name || ''}
            lastName={user?.last_name}
            imageUrl={user?.avatar_url}
            size={72}
          />
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Badge label={user?.role || ''} variant={roleVariant(user?.role || '')} size="md" />
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Edit Profile" />
          <MenuItem icon="notifications-outline" label="Notification Settings" />
          <MenuItem icon="shield-outline" label="Security" />
          <MenuItem icon="color-palette-outline" label="Appearance" />
          <MenuItem icon="help-circle-outline" label="Help & Support" />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
    marginBottom: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuSection: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.errorLight,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
});
