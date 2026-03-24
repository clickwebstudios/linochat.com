import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { getCompanies } from '@/lib/api/companies';
import type { Company } from '@/lib/api/types';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'trial': return 'warning';
    case 'suspended': return 'error';
    default: return 'default';
  }
};

const companyColors = [Colors.primary, Colors.secondary, Colors.success, Colors.error, Colors.warning, Colors.accent];

export default function CompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      if (__DEV__) console.log('Companies fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Companies</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchField}
              placeholder="Search companies..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          filtered.map((company, index) => (
            <Card
              key={company.id}
              style={styles.companyCard}
            >
              <TouchableOpacity onPress={() => setExpandedId(expandedId === company.id ? null : company.id)} activeOpacity={0.7}>
              <View style={styles.companyHeader}>
                <Avatar
                  firstName={company.name}
                  size={44}
                  color={companyColors[index % companyColors.length]}
                />
                <View style={styles.companyInfo}>
                  <View style={styles.companyNameRow}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Badge
                      label={company.status}
                      variant={statusVariant(company.status)}
                    />
                  </View>
                  {company.domain && (
                    <Text style={styles.companyDomain}>
                      <Ionicons name="globe-outline" size={12} color={Colors.textMuted} />{' '}
                      {company.domain}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{company.agents_count ?? 0} agents</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{company.members_count ?? 0} members</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="folder-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{company.projects_count ?? 0} projects</Text>
                </View>
              </View>
              </TouchableOpacity>

              {/* Expanded details */}
              {expandedId === company.id && (
                <View style={styles.expandedSection}>
                  {company.email && (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{company.email}</Text>
                    </View>
                  )}
                  {company.phone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{company.phone}</Text>
                    </View>
                  )}
                  {company.location && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{company.location}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/(app)/company/${company.id}`)}
                  >
                    <Text style={styles.viewDetailsText}>View Company Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <Text style={styles.emptyText}>No companies found</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyCard: {
    marginBottom: 12,
    padding: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  companyDomain: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    marginTop: 8,
  },
  viewDetailsText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
