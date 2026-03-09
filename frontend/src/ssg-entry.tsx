import { StaticRouter, Routes, Route, Navigate } from 'react-router';

// Marketing Pages
import HomePage from './app/pages/marketing/HomePage';
import FeaturesPage from './app/pages/marketing/FeaturesPage';
import PricingPage from './app/pages/marketing/PricingPage';
import ResourcesPage from './app/pages/marketing/ResourcesPage';
import AboutPage from './app/pages/marketing/AboutPage';
import ContactPage from './app/pages/marketing/ContactPage';

// Dashboard Pages (will be client-side only)
import AgentDashboard from './app/pages/dashboards/AgentDashboard';
import SuperadminDashboard from './app/pages/dashboards/SuperadminDashboard';

// Customer Pages
import HelpCenter from './app/pages/customer/HelpCenter';

export default function SSGApp({ url }: { url: string }) {
  return (
      <StaticRouter location={url}>
        <Routes>
          {/* Marketing Website - These will be pre-rendered */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Dashboards - Client-side only */}
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/admin/dashboard" element={<SuperadminDashboard />} />

          {/* Customer-facing */}
          <Route path="/help" element={<HelpCenter />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StaticRouter>
  );
}

// Define which routes to pre-render
export const routes = [
  '/',
  '/features',
  '/pricing',
  '/resources',
  '/about',
  '/contact',
  '/help',
];