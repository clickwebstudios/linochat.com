import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { getDashboardStats } from '@/lib/api/companies';
import { getAdminDashboardStats } from '@/lib/api/chats';
import { formatTimeAgo } from '@/lib/utils/formatting';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';

  const fetchData = async () => {
    try {
      if (isSuperadmin) {
        const data = await getDashboardStats();
        setStats(data);
      } else {
        const data = await getAdminDashboardStats();
        setStats(data);
      }
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {user?.first_name}</Text>
          </View>
          <Ionicons name="menu-outline" size={24} color={Colors.text} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight + '20' }]}>
                  <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statNumber}>{stats?.total_chats ?? 0}</Text>
                <Text style={styles.statLabel}>Total Chats</Text>
              </Card>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
                  <Ionicons name="business-outline" size={20} color={Colors.warning} />
                </View>
                <Text style={styles.statNumber}>
                  {isSuperadmin ? (stats?.total_companies ?? 0) : (stats?.total_tickets ?? 0)}
                </Text>
                <Text style={styles.statLabel}>
                  {isSuperadmin ? 'Total Companies' : 'Total Tickets'}
                </Text>
              </Card>
            </View>

            {/* Latest Sign Ups / Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isSuperadmin ? 'Latest Sign Ups' : 'Recent Activity'}
                </Text>
                <Badge label="12 This Week" variant="info" />
              </View>

              {(stats?.recent_signups || []).map((signup: any, index: number) => (
                <View key={signup.id || index} style={styles.signupRow}>
                  <Avatar
                    firstName={signup.company_name || signup.admin_name || 'C'}
                    size={40}
                    color={[Colors.success, Colors.primary, Colors.warning, Colors.secondary][index % 4]}
                  />
                  <View style={styles.signupInfo}>
                    <Text style={styles.signupName}>{signup.company_name || signup.admin_name}</Text>
                    <Text style={styles.signupEmail}>{signup.admin_email}</Text>
                    {signup.status && <Badge label={signup.status} variant="info" />}
                  </View>
                  <Text style={styles.signupTime}>
                    {signup.created_at ? formatTimeAgo(signup.created_at) : ''}
                  </Text>
                </View>
              ))}

              {(!stats?.recent_signups || stats.recent_signups.length === 0) && (
                <Text style={styles.emptyText}>No recent activity</Text>
              )}
            </View>

            {/* System Alerts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Alerts</Text>
              {(stats?.system_alerts || []).map((alert: any, index: number) => (
                <View key={alert.id || index} style={styles.alertRow}>
                  <Ionicons
                    name={alert.type === 'warning' ? 'warning-outline' : 'information-circle-outline'}
                    size={20}
                    color={alert.type === 'warning' ? Colors.warning : Colors.info}
                  />
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
              ))}
              {(!stats?.system_alerts || stats.system_alerts.length === 0) && (
                <Text style={styles.emptyText}>No alerts</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  signupInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  signupName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  signupEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  signupTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
