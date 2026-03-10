import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

// New Auth System
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Marketing Pages (SSG-rendered, keep eager for fast initial load)
import HomePage from './pages/marketing/HomePage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import ResourcesPage from './pages/marketing/ResourcesPage';
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';

// Layout Components (needed for route structure)
import AgentAdminLayout from './components/layouts/AgentAdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded dashboard pages
const AgentDashboard = lazy(() => import('./pages/dashboards/AgentDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));
const SuperadminDashboard = lazy(() => import('./pages/dashboards/SuperadminDashboard'));
const ExampleDashboard = lazy(() => import('./pages/dashboards/ExampleDashboard'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const ProfileSettings = lazy(() => import('./pages/dashboards/ProfileSettings'));
const AgentDetails = lazy(() => import('./pages/dashboards/AgentDetails'));
const TicketDetails = lazy(() => import('./pages/dashboards/TicketDetails'));
const ChatDetails = lazy(() => import('./pages/dashboards/ChatDetails'));
const CompanyDetails = lazy(() => import('./pages/dashboards/CompanyDetails'));
const SuperadminAgentDetails = lazy(() => import('./pages/dashboards/SuperadminAgentDetails'));
const UserDetails = lazy(() => import('./pages/dashboards/UserDetails'));
const NotificationsPage = lazy(() => import('./pages/dashboards/NotificationsPage'));
const AIArticleGenerator = lazy(() => import('./pages/AIArticleGenerator'));
const CreateArticle = lazy(() => import('./pages/CreateArticle'));
const ArticleDetails = lazy(() => import('./pages/ArticleDetails'));
const BillingPage = lazy(() => import('./pages/dashboards/BillingPage'));
const OAuthAuthorizePage = lazy(() => import('./pages/oauth/OAuthAuthorizePage'));
const OAuthAppsPage = lazy(() => import('./pages/oauth/OAuthAppsPage'));

// Lazy-loaded standalone pages
const ExampleChatDashboard = lazy(() => import('./components/layouts').then(m => ({ default: m.ExampleChatDashboard })));
const HelpCenter = lazy(() => import('./pages/customer/HelpCenter'));
const PublicTicketPage = lazy(() => import('./pages/PublicTicketPage').then(m => ({ default: m.PublicTicketPage })));

// Legacy Auth Pages
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const InviteAcceptPage = lazy(() => import('./pages/auth/InviteAcceptPage'));

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
    </div>
  );
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

function DashboardPage() {
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <HelmetProvider>
      <AuthInitializer>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Marketing Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Auth Pages */}
              <Route
                path="/login"
                element={
                  <PublicRoute redirectTo="/dashboard">
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute redirectTo="/dashboard">
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={<PublicRoute redirectTo="/dashboard"><RegisterPage /></PublicRoute>}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Agent Layout Routes */}
              <Route element={<ProtectedRoute><ErrorBoundary><AgentAdminLayout role="Agent" /></ErrorBoundary></ProtectedRoute>}>
                <Route path="/agent/dashboard" element={<AgentDashboard />} />
                <Route path="/agent/chats" element={<AgentDashboard />} />
                <Route path="/agent/tickets" element={<AgentDashboard />} />
                <Route path="/agent/knowledge" element={<AgentDashboard />} />
                <Route path="/agent/chats/:chatId" element={<ChatDetails />} />
                <Route path="/agent/tickets/:ticketId" element={<TicketDetails />} />
                <Route path="/agent/users/:agentId" element={<AgentDetails />} />
                <Route path="/agent/project/:projectId" element={<ProjectDetails />} />
                <Route path="/agent/knowledge/article/:articleId" element={<ArticleDetails />} />
                <Route path="/agent/profile-settings" element={<ProfileSettings />} />
                <Route path="/agent/billing" element={<BillingPage />} />
                <Route path="/agent/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Admin Layout Routes */}
              <Route element={<ProtectedRoute><ErrorBoundary><AgentAdminLayout role="Admin" /></ErrorBoundary></ProtectedRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/projects" element={<AdminDashboard />} />
                <Route path="/admin/chats" element={<AdminDashboard />} />
                <Route path="/admin/tickets" element={<AdminDashboard />} />
                <Route path="/admin/knowledge" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<AdminDashboard />} />
                <Route path="/admin/integrations" element={<AdminDashboard />} />
                <Route path="/admin/chats/:chatId" element={<ChatDetails />} />
                <Route path="/admin/tickets/:ticketId" element={<TicketDetails />} />
                <Route path="/admin/users/:agentId" element={<AgentDetails />} />
                <Route path="/admin/project/:projectId" element={<ProjectDetails />} />
                <Route path="/admin/ai-article-generator" element={<AIArticleGenerator />} />
                <Route path="/admin/create-article" element={<CreateArticle />} />
                <Route path="/admin/knowledge/article/:articleId" element={<ArticleDetails />} />
                <Route path="/admin/profile-settings" element={<ProfileSettings />} />
                <Route path="/admin/billing" element={<BillingPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Superadmin Layout Routes */}
              <Route element={<ProtectedRoute><ErrorBoundary><AgentAdminLayout role="Superadmin" /></ErrorBoundary></ProtectedRoute>}>
                <Route path="/superadmin/dashboard" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/chats" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/tickets" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/knowledge" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/projects" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/users" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/reports" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/integrations" element={<AgentDashboard role="Superadmin" />} />
                <Route path="/superadmin/chats/:chatId" element={<ChatDetails />} />
                <Route path="/superadmin/tickets/:ticketId" element={<TicketDetails />} />
                <Route path="/superadmin/users/:agentId" element={<AgentDetails />} />
                <Route path="/superadmin/project/:projectId" element={<ProjectDetails />} />
                <Route path="/superadmin/ai-article-generator" element={<AIArticleGenerator />} />
                <Route path="/superadmin/create-article" element={<CreateArticle />} />
                <Route path="/superadmin/knowledge/article/:articleId" element={<ArticleDetails />} />
                <Route path="/superadmin/profile-settings" element={<ProfileSettings />} />
                <Route path="/superadmin/billing" element={<BillingPage />} />
                <Route path="/superadmin/notifications" element={<NotificationsPage />} />
                <Route path="/superadmin/companies" element={<SuperadminDashboard />} />
                <Route path="/superadmin/company/:companyId" element={<CompanyDetails />} />
                <Route path="/superadmin/agent/:agentId" element={<SuperadminAgentDetails />} />
                <Route path="/superadmin/user/:userId" element={<UserDetails />} />
              </Route>

              {/* Legacy path redirects */}
              <Route path="/dashboard/agent" element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="/agent-dashboard" element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="/superadmin-dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="/ai-article-generator" element={<Navigate to="/admin/ai-article-generator" replace />} />
              <Route path="/create-article" element={<Navigate to="/admin/create-article" replace />} />

              {/* OAuth authorization page — shown when 3rd-party app redirects user here */}
              <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />

              {/* OAuth apps management — in admin/agent settings */}
              <Route
                path="/admin/oauth-apps"
                element={<ProtectedRoute><ErrorBoundary><OAuthAppsPage /></ErrorBoundary></ProtectedRoute>}
              />
              <Route
                path="/agent/oauth-apps"
                element={<ProtectedRoute><ErrorBoundary><OAuthAppsPage /></ErrorBoundary></ProtectedRoute>}
              />

              {/* Standalone pages */}
              <Route path="/example-dashboard" element={<ExampleDashboard />} />
              <Route path="/example-chat-dashboard" element={<ExampleChatDashboard />} />

              {/* Customer-facing */}
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/ticket/:token" element={<PublicTicketPage />} />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthInitializer>
    </HelmetProvider>
    </GoogleOAuthProvider>
  );
}
