import { BarChart3, Sparkles } from 'lucide-react';

export function ReportsView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
          <BarChart3 className="h-10 w-10 text-blue-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <h2 className="text-2xl text-gray-900 mb-2">Reports Coming Soon</h2>
      <p className="text-gray-500 max-w-md mb-8">
        We're building comprehensive reporting and analytics tools to help you track performance, measure satisfaction, and optimize your support operations. Stay tuned!
      </p>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { name: 'Response Time', icon: '⏱️' },
          { name: 'Satisfaction', icon: '👍' },
          { name: 'Ticket Volume', icon: '🎫' },
          { name: 'Resolution Rate', icon: '✅' },
          { name: 'Agent Load', icon: '👥' },
          { name: 'SLA Compliance', icon: '📋' },
          { name: 'Trends', icon: '📈' },
          { name: 'Exports', icon: '📊' },
        ].map((item) => (
          <div
            key={item.name}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 opacity-60"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-gray-500">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}