import { Plug, Sparkles } from 'lucide-react';

const integrationLogos = [
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
          <Plug className="h-10 w-10 text-blue-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <h2 className="text-2xl text-gray-900 mb-2">Integrations Coming Soon</h2>
      <p className="text-gray-500 max-w-md mb-8">
        We're working on powerful integrations to connect LinoChat with your favorite tools and services. Stay tuned!
      </p>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {integrationLogos.map((integration) => (
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
  );
}
