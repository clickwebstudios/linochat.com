import { Plug, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

function FrubixLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text>
    </svg>
  );
}

const comingSoonIntegrations = [
  { name: 'Slack', icon: '\u{1F4AC}' },
  { name: 'Salesforce', icon: '\u{2601}\u{FE0F}' },
  { name: 'Zapier', icon: '\u{26A1}' },
  { name: 'Jira', icon: '\u{1F4CB}' },
  { name: 'HubSpot', icon: '\u{1F536}' },
  { name: 'GitHub', icon: '\u{1F431}' },
  { name: 'Stripe', icon: '\u{1F4B3}' },
  { name: 'Zendesk', icon: '\u{1F3AB}' },
];

export function IntegrationsView() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Integrations</h2>
        <p className="text-gray-500 mt-1">Connect LinoChat with your favorite tools and services.</p>
      </div>

      {/* Active Integrations */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Active</h3>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FrubixLogo className="h-12 w-12" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">Frubix</h3>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Project management and deployment automation platform.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://frubix.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Frubix
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Coming Soon</h3>
        <div className="grid grid-cols-4 gap-4">
          {comingSoonIntegrations.map((integration) => (
            <div
              key={integration.name}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 opacity-60"
            >
              <span className="text-2xl">{integration.icon}</span>
              <span className="text-xs text-gray-500">{integration.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
