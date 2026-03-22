import { useState } from 'react';
import {
  List,
  Settings2,
  BarChart3,
  MousePointerClick,
} from 'lucide-react';

type PopoverSection = 'campaigns' | 'triggers' | 'analytics' | 'settings';

const POPOVER_NAV = [
  { id: 'campaigns' as PopoverSection, label: 'Campaigns', icon: List },
  { id: 'triggers' as PopoverSection, label: 'Triggers', icon: MousePointerClick },
  { id: 'analytics' as PopoverSection, label: 'Analytics', icon: BarChart3 },
  { id: 'settings' as PopoverSection, label: 'Settings', icon: Settings2 },
];

interface PopoversTabProps {
  projectId: string;
}

export function PopoversTab({ projectId: _projectId }: PopoversTabProps) {
  const [activeSection, setActiveSection] = useState<PopoverSection>('campaigns');

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 shrink-0">
        <nav className="space-y-1">
          {POPOVER_NAV.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === 'campaigns' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Popover Campaigns</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create targeted popover messages that appear to visitors based on conditions you define.
              </p>
            </div>
            <div className="flex items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="text-sm">Campaign list will appear here</p>
            </div>
          </div>
        )}

        {activeSection === 'triggers' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Triggers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Define when and where popovers should appear — page visits, scroll depth, exit intent, and more.
              </p>
            </div>
            <div className="flex items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="text-sm">Trigger configuration will appear here</p>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track impressions, clicks, and conversions for your popover campaigns.
              </p>
            </div>
            <div className="flex items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="text-sm">Popover analytics will appear here</p>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Popover Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Global settings for popover behavior, frequency capping, and display rules.
              </p>
            </div>
            <div className="flex items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="text-sm">Global popover settings will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
