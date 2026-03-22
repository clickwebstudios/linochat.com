import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/utils/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getCompanyDetail, getCompanyChats } from '@/lib/api/companies';
import { formatDate, formatTimeAgo } from '@/lib/utils/formatting';
import type { CompanyDetail, Chat, Member } from '@/lib/api/types';

type TabName = 'Overview' | 'Agents' | 'Members' | 'Chats' | 'Settings';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const companyData = await getCompanyDetail(Number(id));
      setCompany(companyData);
      if (activeTab === 'Chats') {
        const chatsData = await getCompanyChats(Number(id));
        setChats(chatsData);
      }
    } catch (err) {
      console.log('Company detail error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const tabs: TabName[] = ['Overview', 'Agents', 'Members', 'Chats', 'Settings'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(app)/(tabs)/companies')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Avatar firstName={company?.name || ''} size={36} color={Colors.primary} />
          <Text style={styles.headerTitle}>{company?.name}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {activeTab === 'Overview' && <OverviewTab company={company!} />}
        {activeTab === 'Agents' && <AgentsTab company={company!} />}
        {activeTab === 'Members' && <MembersTab company={company!} />}
        {activeTab === 'Chats' && <ChatsTab chats={chats} />}
        {activeTab === 'Settings' && <SettingsTab company={company!} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Overview Tab ---
function OverviewTab({ company }: { company: CompanyDetail }) {
  return (
    <View style={styles.tabContent}>
      {/* Project info */}
      {company.projects?.[0] && (
        <Card style={styles.projectCard}>
          <View style={styles.projectRow}>
            <Ionicons name="folder-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.projectName}>{company.projects[0].name}</Text>
              <Text style={styles.projectSub}>{company.projects.length} projects · {company.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>{company.agents_count}</Text>
          <Text style={styles.statBoxLabel}>Agents</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>{company.members_count}</Text>
          <Text style={styles.statBoxLabel}>Members</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>{company.projects_count}</Text>
          <Text style={styles.statBoxLabel}>Projects</Text>
        </View>
      </View>

      {/* Contact Info */}
      <Text style={styles.sectionLabel}>Contact Info</Text>
      {company.email && <InfoRow icon="mail-outline" text={company.email} />}
      {company.phone && <InfoRow icon="call-outline" text={company.phone} />}
      {company.location && <InfoRow icon="location-outline" text={company.location} />}
      {company.domain && <InfoRow icon="link-outline" text={company.domain} />}

      {/* Activity */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Activity</Text>
      <InfoRow icon="chatbubble-outline" text="Total Conversations" right={String(company.total_conversations || 0)} />
      <InfoRow icon="time-outline" text="Avg Response Time" right={company.avg_response_time || 'N/A'} />
      <InfoRow icon="star-outline" text="Satisfaction Rate" right={company.satisfaction_rate ? `${company.satisfaction_rate}%` : 'N/A'} />
      <InfoRow icon="calendar-outline" text="Created" right={company.created_at ? formatDate(company.created_at) : 'N/A'} />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warningLight }]}>
          <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Set to Trial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.errorLight }]}>
          <Text style={[styles.actionBtnText, { color: Colors.error }]}>Delete Company</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Agents Tab ---
function AgentsTab({ company }: { company: CompanyDetail }) {
  // Mock agents data based on design
  const agents = [
    { id: 1, name: 'Sales Assistant', type: 'Customer Support', model: 'GPT-4o', conversations: 1237, satisfaction: 64, status: 'active' },
    { id: 2, name: 'Onboarding Bot', type: 'Onboarding', model: 'GPT-4o', conversations: 856, satisfaction: 67, status: 'active' },
    { id: 3, name: 'FAQ Handler', type: 'Knowledge Base', model: 'GPT-4o Mini', conversations: 3421, satisfaction: 81, status: 'active' },
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.agentHeader}>
        <Text style={styles.agentCount}>{agents.length} agents configured</Text>
        <TouchableOpacity style={styles.addAgentBtn}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addAgentText}>Add Agent</Text>
        </TouchableOpacity>
      </View>

      {agents.map((agent) => (
        <Card key={agent.id} style={styles.agentCard}>
          <View style={styles.agentRow}>
            <View style={styles.agentIcon}>
              <Ionicons name="hardware-chip-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.agentNameRow}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.agentType}>{agent.type} · {agent.model}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
          <View style={styles.agentStats}>
            <View style={styles.agentStat}>
              <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.agentStatText}>{agent.conversations.toLocaleString()}</Text>
            </View>
            <View style={styles.agentStat}>
              <Ionicons name="thumbs-up-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.agentStatText}>{agent.satisfaction}%</Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

// --- Members Tab ---
function MembersTab({ company }: { company: CompanyDetail }) {
  const members = company.users || [];
  const onlineCount = members.filter((m) => m.status === 'Active').length;

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.roleAdmin;
      case 'agent': return Colors.roleAgent;
      default: return Colors.roleOwner;
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.memberHeader}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchField}
            placeholder="Search members..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.inviteBtn}>
          <Ionicons name="person-add-outline" size={16} color={Colors.white} />
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberMeta}>
        <Text style={styles.memberMetaText}>{members.length} members</Text>
        <Text style={styles.memberMetaText}>{onlineCount} online</Text>
      </View>

      {members.map((member) => (
        <View key={member.id} style={styles.memberRow}>
          <View style={styles.memberAvatarWrap}>
            <Avatar firstName={member.first_name} lastName={member.last_name} size={40} color={roleColor(member.role)} />
            {member.status === 'Active' && <View style={styles.onlineDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{member.first_name} {member.last_name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>
          <Badge label={member.role === 'admin' ? 'Admin' : member.role === 'agent' ? 'Agent' : 'Owner'} variant={member.role === 'admin' ? 'info' : member.role === 'agent' ? 'success' : 'warning'} />
        </View>
      ))}

      {members.length === 0 && (
        <Text style={styles.emptyText}>No members found</Text>
      )}
    </View>
  );
}

// --- Chats Tab ---
function ChatsTab({ chats = [] }: { chats: Chat[] }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.searchInput}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchField}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <Text style={styles.chatsSectionTitle}>Recent conversations</Text>

      {chats.map((chat) => (
        <TouchableOpacity key={chat.id} style={styles.chatItem}>
          <View style={[styles.chatAvatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.chatAvatarText}>{chat.customer_name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.chatTopRow}>
              <Text style={styles.chatName}>{chat.customer_name}</Text>
              <Text style={styles.chatTime}>{formatTimeAgo(chat.last_message_at)}</Text>
            </View>
            <Text style={styles.chatPreview} numberOfLines={1}>{chat.preview || 'No messages'}</Text>
            {chat.agent_name && (
              <Text style={styles.chatAgentName}><Ionicons name="person-outline" size={11} color={Colors.textMuted} /> {chat.agent_name}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {chats.length === 0 && (
        <Text style={styles.emptyText}>No conversations found</Text>
      )}
    </View>
  );
}

// --- Settings Tab ---
function SettingsTab({ company }: { company: CompanyDetail }) {
  const [autoReply, setAutoReply] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [businessHours, setBusinessHours] = useState(false);
  const [dataRetention, setDataRetention] = useState(true);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>Company Info</Text>
      <SettingField icon="business-outline" label="Company Name" value={company.name} />
      <SettingField icon="globe-outline" label="Domain" value={company.domain || 'N/A'} />
      <SettingField icon="mail-outline" label="Contact Email" value={company.email || 'N/A'} />

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Preferences</Text>
      <SettingToggle label="Auto-reply" subtitle="Respond when agents are unavailable" value={autoReply} onToggle={setAutoReply} />
      <SettingToggle label="Notifications" subtitle="Email alerts for new conversations" value={notifications} onToggle={setNotifications} />
      <SettingToggle label="Business Hours" subtitle="Only accept chats during work hours" value={businessHours} onToggle={setBusinessHours} />
      <SettingToggle label="Data Retention" subtitle="Keep conversation history for 90 days" value={dataRetention} onToggle={setDataRetention} />

      <Text style={[styles.sectionLabel, { marginTop: 24, color: Colors.error }]}>Danger Zone</Text>
      <TouchableOpacity style={styles.dangerButton}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
        <Text style={styles.dangerButtonText}>Delete Company</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Helpers ---
function InfoRow({ icon, text, right }: { icon: string; text: string; right?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
      <Text style={styles.infoText}>{text}</Text>
      {right && <Text style={styles.infoRight}>{right}</Text>}
    </View>
  );
}

function SettingField({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.settingField}>
      <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
      <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
    </View>
  );
}

function SettingToggle({ label, subtitle, value, onToggle }: { label: string; subtitle: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  content: { paddingBottom: 40 },
  tabContent: { padding: 20 },

  // Overview
  projectCard: { marginBottom: 16 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projectName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  projectSub: { fontSize: 12, color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statBoxNumber: { fontSize: 24, fontWeight: '700', color: Colors.text },
  statBoxLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  infoText: { flex: 1, fontSize: 14, color: Colors.text },
  infoRight: { fontSize: 14, fontWeight: '600', color: Colors.text },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },

  // Agents
  agentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  agentCount: { fontSize: 14, color: Colors.textSecondary },
  addAgentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  addAgentText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  agentCard: { marginBottom: 12, padding: 14 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center',
  },
  agentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agentName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  agentType: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  agentStats: {
    flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  agentStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  agentStatText: { fontSize: 12, color: Colors.textSecondary },

  // Members
  memberHeader: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, height: 40,
  },
  searchField: { flex: 1, fontSize: 13, color: Colors.text },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 12, borderRadius: 8,
  },
  inviteBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  memberMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  memberMetaText: { fontSize: 13, color: Colors.textSecondary },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  memberAvatarWrap: { position: 'relative' },
  onlineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.white,
    position: 'absolute', bottom: 0, right: 0,
  },
  memberName: { fontSize: 15, fontWeight: '500', color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textMuted },

  // Chats
  chatsSectionTitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 16, marginBottom: 8 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chatName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  chatTime: { fontSize: 11, color: Colors.textMuted },
  chatPreview: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  chatAgentName: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Settings
  settingField: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  settingLabel: { fontSize: 12, color: Colors.textSecondary },
  settingValue: { fontSize: 15, fontWeight: '500', color: Colors.text },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  toggleSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dangerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderWidth: 1, borderColor: Colors.errorLight,
    borderRadius: 10, backgroundColor: Colors.errorLight,
  },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: Colors.error },

  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 30 },
});
