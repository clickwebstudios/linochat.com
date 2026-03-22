import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { motion } from 'motion/react';
import {
  MessageCircle,
  Ticket,
  BarChart3,
  Zap,
  Users,
  Globe,
  Bot,
  ArrowRight,
  Star,
  Sparkles,
  Plug,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { mockTestimonials } from '../../data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

const staggerChild = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

function ChatMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow behind the mockup */}
      <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />

      <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b px-5 py-3.5 bg-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">LinoChat AI</div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 p-5 bg-muted/30 min-h-[260px]">
          {/* Customer message */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[75%]">
              I need help resetting my password
            </div>
          </div>

          {/* AI response */}
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-card border px-4 py-2.5 text-sm max-w-[80%] shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">AI Assistant</span>
              </div>
              I can help you with that! I've sent a reset link to your email. You should receive it within 30 seconds.
            </div>
          </div>

          {/* Customer reply */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[75%]">
              That was instant! Thank you!
            </div>
          </div>

          {/* AI with resolution */}
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-card border px-4 py-2.5 text-sm max-w-[80%] shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-green-600">Resolved in 12s</span>
              </div>
              You're all set! Is there anything else I can help with?
            </div>
          </div>
        </div>

        {/* Chat input */}
        <div className="flex items-center gap-2 border-t px-4 py-3 bg-card">
          <div className="flex-1 rounded-full bg-muted/50 border px-4 py-2 text-sm text-muted-foreground">
            Type a message...
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

const trustedCompanies = ['TechCorp', 'Acme Inc', 'GlobalServ', 'StartupX', 'CloudBase', 'DataFlow'];

const stats = [
  { value: '10,000+', label: 'Customers' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<2 min', label: 'Response Time' },
  { value: '94%', label: 'CSAT Score' },
];

const features = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'AI Chatbots',
    description: 'Resolve up to 70% of queries instantly with intelligent AI that learns your product inside and out.',
    size: 'large' as const,
    accent: 'from-primary/10 to-blue-500/5',
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: 'Live Chat',
    description: 'Real-time conversations with customers. Seamless handoff from AI to human agents when needed.',
    size: 'small' as const,
    accent: 'from-emerald-500/10 to-green-500/5',
  },
  {
    icon: <Ticket className="h-6 w-6" />,
    title: 'Smart Ticketing',
    description: 'Auto-prioritize, categorize, and route tickets to the right agent every time.',
    size: 'small' as const,
    accent: 'from-violet-500/10 to-purple-500/5',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Analytics Dashboard',
    description: 'Track CSAT, resolution times, agent performance, and customer trends with real-time dashboards.',
    size: 'small' as const,
    accent: 'from-amber-500/10 to-orange-500/5',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Multi-channel',
    description: 'Email, chat, social, and more — all unified in a single inbox your team will love.',
    size: 'small' as const,
    accent: 'from-cyan-500/10 to-sky-500/5',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Team Collaboration',
    description: 'Internal notes, mentions, shared views, and collision detection so your team works in perfect sync.',
    size: 'large' as const,
    accent: 'from-rose-500/10 to-pink-500/5',
  },
];

const steps = [
  {
    number: '01',
    icon: <Plug className="h-7 w-7" />,
    title: 'Connect',
    description: 'Add a single code snippet to your site. Integrate with Slack, email, and your existing tools in minutes.',
  },
  {
    number: '02',
    icon: <Zap className="h-7 w-7" />,
    title: 'Automate',
    description: 'Train your AI assistant on your docs and past tickets. Set up workflows and routing rules effortlessly.',
  },
  {
    number: '03',
    icon: <Sparkles className="h-7 w-7" />,
    title: 'Scale',
    description: 'Handle 10x the volume without 10x the headcount. Watch your CSAT climb and costs drop.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Modern Customer Support Platform"
        description="Transform your customer support with LinoChat. AI-powered live chat, ticketing, and helpdesk software designed for growing teams. Start your free trial today."
        keywords="customer support software, helpdesk software, live chat, ticketing system, AI customer service, support platform"
        canonical="https://linochat.com"
      />
      <MarketingHeader />

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Animated gradient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-violet-500/[0.05]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/[0.06] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-violet-500/[0.04] blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-2 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Now with GPT-powered AI
              </Badge>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
                Customer Support That Actually{' '}
                <span className="text-primary">Scales</span>
              </h1>

              <p className="mb-8 text-lg text-muted-foreground leading-relaxed sm:text-xl">
                AI-powered live chat, smart ticketing, and a unified inbox — everything your team needs
                to deliver fast, personal support without burning out.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="h-12 px-7 text-base gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="h-12 px-7 text-base">
                    Book a Demo
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                No credit card required &middot; 14-day free trial &middot; Cancel anytime
              </p>
            </motion.div>

            {/* Right — chat mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ChatMockup />
            </motion.div>
          </div>

          {/* Trusted-by logo cloud */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 pt-10 border-t border-border/50"
          >
            <p className="text-center text-sm font-medium text-muted-foreground mb-8 tracking-wide uppercase">
              Trusted by forward-thinking teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {trustedCompanies.map((name) => (
                <span
                  key={name}
                  className="text-xl font-bold text-muted-foreground/40 tracking-tight select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((stat, i) => (
              <motion.div key={i} {...staggerChild(i * 0.08)}>
                <div className="text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES — BENTO GRID ========== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to delight customers
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools designed for modern support teams — from AI automation to real-time analytics.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                {...staggerChild(i * 0.07)}
                className={feature.size === 'large' ? 'lg:col-span-2' : ''}
              >
                <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/20">
                  <CardContent className={`relative p-7 h-full bg-gradient-to-br ${feature.accent}`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-105 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-20 lg:py-28 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Up and running in minutes, not months
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your customer support experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div key={i} {...staggerChild(i * 0.12)} className="relative">
                {/* Connector line (hidden on mobile and after last) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px border-t-2 border-dashed border-border" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {step.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
              <Star className="h-3.5 w-3.5 text-primary" />
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Loved by support teams everywhere
            </h2>
            <p className="text-lg text-muted-foreground">
              Don't just take our word for it — hear from the teams already using LinoChat.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {mockTestimonials.map((testimonial, i) => (
              <motion.div key={i} {...staggerChild(i * 0.1)}>
                <Card className="h-full hover:shadow-lg transition-shadow border-border/60">
                  <CardContent className="p-7 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-foreground leading-relaxed mb-6 flex-1">
                      <span className="text-primary font-serif text-2xl leading-none mr-1">&ldquo;</span>
                      {testimonial.quote}
                      <span className="text-primary font-serif text-2xl leading-none ml-0.5">&rdquo;</span>
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.author}</div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role}, {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />

        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-primary-foreground mb-5">
              Ready to transform your customer support?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Join 10,000+ teams already delivering faster, smarter support with LinoChat.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your work email"
                className="h-12 bg-white/95 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
              <Link to="/signup">
                <Button size="lg" className="h-12 px-7 whitespace-nowrap bg-card text-primary hover:bg-card/90 font-semibold gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-sm text-primary-foreground/70">
              No credit card required &middot; 14-day free trial &middot; Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
