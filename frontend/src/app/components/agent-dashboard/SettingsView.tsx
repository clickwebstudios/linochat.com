import { useState } from 'react';
import { Settings, Plug, Bell, Activity } from 'lucide-react';
import { IntegrationsView } from './IntegrationsView';
import { NotificationsSettingsView } from './NotificationsSettingsView';
import { ActivityView } from './ActivityView';

type SettingsTab = 'integrations' | 'notifications' | 'activity';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'integrations', label: 'Integrations', icon: <Plug className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { key: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'integrations' && <IntegrationsView />}
      {activeTab === 'notifications' && <NotificationsSettingsView />}
      {activeTab === 'activity' && <ActivityView />}
    </div>
  );
}
