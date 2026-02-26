import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';

// New Auth System
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { Layout } from './components/layout/Layout';

// Marketing Pages
import HomePage from './pages/marketing/HomePage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import ResourcesPage from './pages/marketing/ResourcesPage';
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';

// Layout Components
import AgentAdminLayout from './components/layouts/AgentAdminLayout';
import SuperadminLayout from './components/layouts/SuperadminLayout';

// Dashboard Pages
import AgentDashboard from './pages/dashboards/AgentDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import SuperadminDashboard from './pages/dashboards/SuperadminDashboard';
import ExampleDashboard from './pages/dashboards/ExampleDashboard';
import ProjectDetails from './pages/ProjectDetails';
import ProfileSettings from './pages/dashboards/ProfileSettings';
import SuperadminProfileSettings from './pages/dashboards/SuperadminProfileSettings';
import AgentDetails from './pages/dashboards/AgentDetails';
import TicketDetails from './pages/dashboards/TicketDetails';
import ChatDetails from './pages/dashboards/ChatDetails';
import CompanyDetails from './pages/dashboards/CompanyDetails';
import SuperadminAgentDetails from './pages/dashboards/SuperadminAgentDetails';
import UserDetails from './pages/dashboards/UserDetails';
import NotificationsPage from './pages/dashboards/NotificationsPage';
import AIArticleGenerator from './pages/AIArticleGenerator';
import CreateArticle from './pages/CreateArticle';
import ArticleDetails from './pages/ArticleDetails';
import SuperadminCreateArticle from './pages/dashboards/SuperadminCreateArticle';
import BillingPage from './pages/dashboards/BillingPage';
import { ExampleChatDashboard } from './components/layouts';

// Legacy Auth Pages (keep for compatibility)
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import InviteAcceptPage from './pages/auth/InviteAcceptPage';

// Customer Pages
import HelpCenter from './pages/customer/HelpCenter';

/**
 * AuthInitializer - Initializes auth state on app load
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

/**
 * Dashboard Page - Simple redirect based on role
 * In production, this would check user role and redirect appropriately
 */
function DashboardPage() {
  // For now, redirect to admin dashboard as default
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthInitializer>
        <BrowserRouter>
          <Routes>
            {/* ============================================ */}
            {/* Public Marketing Pages */}
            {/* ============================================ */}
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ============================================ */}
            {/* New Auth Pages with Public Route Protection */}
            {/* ============================================ */}
            
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
            
            {/* Legacy Auth Redirects */}
            <Route 
              path="/signup" 
              element={<PublicRoute redirectTo="/dashboard"><RegisterPage /></PublicRoute>} 
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<InviteAcceptPage />} />

            {/* ============================================ */}
            {/* Protected Dashboard Routes */}
            {/* ============================================ */}
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* ============================================ */}
            {/* Agent Layout Routes (sidebar role = "Agent") */}
            {/* ============================================ */}
            <Route element={<ProtectedRoute><AgentAdminLayout role="Agent" /></ProtectedRoute>}>
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

            {/* ============================================ */}
            {/* Admin Layout Routes (sidebar role = "Admin") */}
            {/* ============================================ */}
            <Route element={<ProtectedRoute><AgentAdminLayout role="Admin" /></ProtectedRoute>}>
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

            {/* ================================================ */}
            {/* Superadmin Layout Routes - uses same AgentAdminLayout with Company Switcher */}
            {/* ================================================ */}
            <Route element={<ProtectedRoute><AgentAdminLayout role="Superadmin" /></ProtectedRoute>}>
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
              {/* Legacy Superadmin specific routes */}
              <Route path="/superadmin/companies" element={<SuperadminDashboard />} />
              <Route path="/superadmin/company/:companyId" element={<CompanyDetails />} />
              <Route path="/superadmin/agent/:agentId" element={<SuperadminAgentDetails />} />
              <Route path="/superadmin/user/:userId" element={<UserDetails />} />
            </Route>

            {/* ============================================ */}
            {/* Legacy path redirects */}
            {/* ============================================ */}
            <Route path="/dashboard/agent" element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="/agent-dashboard" element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="/superadmin-dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="/ai-article-generator" element={<Navigate to="/admin/ai-article-generator" replace />} />
            <Route path="/create-article" element={<Navigate to="/admin/create-article" replace />} />

            {/* Standalone pages (no layout shell) */}
            <Route path="/example-dashboard" element={<ExampleDashboard />} />
            <Route path="/example-chat-dashboard" element={<ExampleChatDashboard />} />

            {/* Customer-facing */}
            <Route path="/help" element={<HelpCenter />} />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthInitializer>
    </HelmetProvider>
  );
}
