// AdminDashboard - Company Admin Dashboard
// This component is based on AgentDashboard with the role label showing "Admin" instead of "Agent"
// For now, we're using the same component. In the future, this can be customized further.

import AgentDashboard from './AgentDashboard';

export default function AdminDashboard() {
  return <AgentDashboard role="Admin" />;
}