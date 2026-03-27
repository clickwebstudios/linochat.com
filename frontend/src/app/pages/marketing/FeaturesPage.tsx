import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'motion/react';
import {
  Bot,
  Ticket,
  BarChart3,
  BookOpen,
  Check,
  Shield,
  Lock,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  Globe,
  Search,
  Send,
  TrendingUp,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

const integrations = [
  { name: 'Salesforce', initials: 'SF', color: 'bg-blue-500' },
  { name: 'Slack', initials: 'SL', color: 'bg-purple-600' },
  { name: 'Shopify', initials: 'SH', color: 'bg-green-600' },
  { name: 'HubSpot', initials: 'HS', color: 'bg-orange-500' },
  { name: 'Stripe', initials: 'ST', color: 'bg-violet-600' },
  { name: 'Gmail', initials: 'GM', color: 'bg-red-500' },
  { name: 'Zapier', initials: 'ZP', color: 'bg-amber-500' },
  { name: 'Zendesk', initials: 'ZD', color: 'bg-emerald-600' },
];

const securityBadges = [
  { icon: <Shield className="h-5 w-5" />, label: 'GDPR Compliant' },
  { icon: <Lock className="h-5 w-5" />, label: 'SOC 2 Type II' },
  { icon: <Lock className="h-5 w-5" />, label: 'SSL 256-bit' },
  { icon: <Clock className="h-5 w-5" />, label: '99.9% Uptime' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Features - Advanced Customer Support Tools"
        description="Explore LinoChat's comprehensive features: AI-powered chat, smart ticketing, real-time analytics, and knowledge base. Built for modern support teams."
        keywords="live chat features, ticketing system, customer support tools, AI chatbot, help desk features, analytics dashboard"
        canonical="https://linochat.com/features"
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-blue-50/50 to-violet-50/30" />
          <div className="absolute top-0 right-1/4 h-[500px] w-[700px] rounded-full bg-primary/[0.10] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[500px] rounded-full bg-violet-500/[0.07] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Everything your team needs
            </Badge>
            <h1 className="mx-auto mb-6 max-w-4xl text-[48px] font-bold leading-tight tracking-tight">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Modern Support Teams</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              From AI-powered conversations to deep analytics, LinoChat gives you everything
              you need to deliver exceptional customer support at scale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature 1: AI-Powered Chat (text left, visual right) */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">AI-Powered Chat</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Deploy an intelligent AI chatbot that understands natural language, resolves
                common queries instantly, and seamlessly hands off to human agents when needed.
              </p>
              <ul className="space-y-4">
                {[
                  'Natural Language Understanding for accurate intent detection',
                  'Automatic handoff to human agents with full context',
                  '24/7 availability across all channels',
                  'Continuous learning from every conversation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Mini chat UI mockup */}
              <div className="rounded-2xl border border-border/80 bg-card p-1 shadow-xl ring-1 ring-black/5">
                <div className="rounded-xl bg-muted/30 p-6">
                  {/* Chat header */}
                  <div className="mb-6 flex items-center gap-3 border-b pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">LinoChat AI</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                    <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500" />
                  </div>
                  {/* Chat messages */}
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        How do I reset my password?
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm shadow-sm">
                        I can help with that! Go to <span className="font-medium text-primary">Settings &gt; Security</span> and click "Reset Password". I'll send a reset link to your email.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        Can I talk to someone?
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm shadow-sm">
                        Of course! I'm connecting you with a support agent now. They'll have the full context of our conversation.
                      </div>
                    </div>
                  </div>
                  {/* Input area */}
                  <div className="mt-6 flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
                    <span className="flex-1 text-sm text-muted-foreground">Type a message...</span>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 2: Smart Ticketing (visual left, text right) */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              {...fadeUp}
              className="order-2 lg:order-1"
            >
              {/* Ticketing mockup */}
              <div className="rounded-2xl border border-border/80 bg-card p-1 shadow-xl ring-1 ring-black/5">
                <div className="rounded-xl bg-muted/30 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Active Tickets</h3>
                    <Badge variant="secondary" className="text-xs">12 open</Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: '#1042', subject: 'Payment failed on checkout', priority: 'High', status: 'In Progress', agent: 'SM', color: 'bg-red-100 text-red-700' },
                      { id: '#1041', subject: 'Cannot export CSV report', priority: 'Medium', status: 'Assigned', agent: 'JD', color: 'bg-yellow-100 text-yellow-700' },
                      { id: '#1040', subject: 'Feature request: dark mode', priority: 'Low', status: 'Queued', agent: 'AR', color: 'bg-blue-100 text-blue-700' },
                      { id: '#1039', subject: 'Login issues with SSO', priority: 'High', status: 'In Progress', agent: 'KL', color: 'bg-red-100 text-red-700' },
                    ].map((ticket) => (
                      <div key={ticket.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {ticket.agent}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">{ticket.id} &middot; {ticket.status}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ticket.color}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="order-1 lg:order-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Ticket className="h-6 w-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Smart Ticketing System</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Never let a customer issue slip through the cracks. Automated routing, SLA
                tracking, and intelligent prioritization keep your team efficient.
              </p>
              <ul className="space-y-4">
                {[
                  'Automated routing based on skills, workload, and topic',
                  'SLA management with real-time breach alerts',
                  'Priority queuing with intelligent escalation rules',
                  'Collision detection to prevent duplicate responses',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 3: Analytics & Insights (text left, visual right) */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Analytics & Insights</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Make data-driven decisions with real-time dashboards that surface the metrics
                that matter. Track performance, satisfaction, and trends at a glance.
              </p>
              <ul className="space-y-4">
                {[
                  'Real-time dashboards with live conversation tracking',
                  'Agent performance metrics and leaderboards',
                  'CSAT and NPS tracking across all channels',
                  'Custom reports with scheduled email delivery',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Analytics dashboard mockup */}
              <div className="rounded-2xl border border-border/80 bg-card p-1 shadow-xl ring-1 ring-black/5">
                <div className="rounded-xl bg-muted/30 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Dashboard Overview</h3>
                    <Badge variant="outline" className="text-xs">Live</Badge>
                  </div>
                  {/* Stats row */}
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Conversations', value: '1,284', change: '+12%' },
                      { label: 'Avg Response', value: '1.4m', change: '-18%' },
                      { label: 'CSAT Score', value: '94.2%', change: '+3%' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold">{stat.value}</p>
                        <p className="flex items-center gap-1 text-xs text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Chart mockup */}
                  <div className="rounded-lg border bg-card p-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">Tickets resolved (7d)</p>
                    <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
                      {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 4: Knowledge Base (visual left, text right) */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              {...fadeUp}
              className="order-2 lg:order-1"
            >
              {/* Knowledge Base mockup */}
              <div className="rounded-2xl border border-border/80 bg-card p-1 shadow-xl ring-1 ring-black/5">
                <div className="rounded-xl bg-muted/30 p-6">
                  {/* Search bar */}
                  <div className="mb-6 flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Search help articles...</span>
                  </div>
                  {/* Suggested articles */}
                  <p className="mb-3 text-xs font-medium text-muted-foreground">Popular Articles</p>
                  <div className="space-y-2">
                    {[
                      { title: 'Getting started with LinoChat', category: 'Onboarding', views: '2.4k' },
                      { title: 'Setting up your first chatbot', category: 'AI & Bots', views: '1.8k' },
                      { title: 'Configuring SLA policies', category: 'Ticketing', views: '1.2k' },
                      { title: 'Integrating with Slack', category: 'Integrations', views: '980' },
                      { title: 'Custom report builder guide', category: 'Analytics', views: '870' },
                    ].map((article) => (
                      <div key={article.title} className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.category}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{article.views} views</span>
                      </div>
                    ))}
                  </div>
                  {/* Languages */}
                  <div className="mt-4 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex gap-1.5">
                      {['EN', 'ES', 'FR', 'DE', 'JP'].map((lang) => (
                        <span key={lang} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="order-1 lg:order-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Knowledge Base</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Empower customers to find answers on their own with an AI-powered knowledge
                base that surfaces the right articles at the right time.
              </p>
              <ul className="space-y-4">
                {[
                  'AI-powered search with smart autocomplete and suggestions',
                  'Contextual article recommendations inside chat',
                  'Multi-language support for global audiences',
                  'Analytics on article performance and search gaps',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Strip */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp}>
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Enterprise-Grade Security</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {securityBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm"
                  >
                    <span className="text-primary">{badge.icon}</span>
                    <span className="font-medium">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            {...fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">See It in Action</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Ready to transform your customer support? Get started for free or book a
              personalized demo with our team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg">
                  Get Started Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline">
                  Book a Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required &middot; Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
