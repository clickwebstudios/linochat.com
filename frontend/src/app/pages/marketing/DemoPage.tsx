import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { motion } from 'motion/react';
import {
  MessageCircle,
  Zap,
  BarChart3,
  Clock,
  Users,
  Shield,
  CheckCircle2,
} from 'lucide-react';

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

const benefits = [
  {
    icon: <MessageCircle className="h-5 w-5 text-primary" />,
    title: 'AI-Powered Live Chat',
    description: 'Resolve 70% of inquiries instantly with smart AI that understands your business.',
  },
  {
    icon: <Zap className="h-5 w-5 text-primary" />,
    title: 'Instant Setup',
    description: 'Go live in minutes, not weeks. No code changes required to get started.',
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    title: 'Actionable Analytics',
    description: 'Track CSAT, response times, and team performance in real time.',
  },
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    title: '24/7 Availability',
    description: 'Your AI agent never sleeps — support customers around the clock.',
  },
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: 'Team Collaboration',
    description: 'Unified inbox, smart routing, and seamless handoffs between AI and humans.',
  },
  {
    icon: <Shield className="h-5 w-5 text-primary" />,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption and role-based access.',
  },
];

const stats = [
  { value: '70%', label: 'Faster response times' },
  { value: '3x', label: 'Agent productivity boost' },
  { value: '45%', label: 'Reduction in support costs' },
  { value: '4.8★', label: 'Average customer rating' },
];

const checklist = [
  'Personalized walkthrough of key features',
  'Custom AI training for your industry',
  'Integration planning with your existing tools',
  'ROI analysis based on your support volume',
  'Q&A with a product specialist',
];

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Book a Demo - See LinoChat in Action"
        description="Schedule a personalized demo of LinoChat. See how AI-powered live chat, smart ticketing, and analytics can transform your customer support."
        keywords="book demo, product demo, customer support demo, AI chat demo, live demo"
        canonical="https://linochat.com/demo"
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-blue-50/50 to-violet-50/30" />
          <div className="absolute top-0 right-1/3 h-[400px] w-[600px] rounded-full bg-primary/[0.10] blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.3]"
            style={{
              backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-1.5 text-sm text-muted-foreground mb-6"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            Free personalized demo — no commitment
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-[48px] font-bold leading-tight"
          >
            See How LinoChat{' '}
            <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              Transforms
            </span>{' '}
            Support
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Get a personalized walkthrough tailored to your business. Our team will show you
            exactly how LinoChat can save time, reduce costs, and delight your customers.
          </motion.p>
        </div>
      </section>

      {/* Booking Form + Checklist */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            {/* Left — What to expect */}
            <motion.div {...staggerChild(0.1)} className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">What to expect</h2>
                <p className="text-muted-foreground">
                  In just 30 minutes, you'll see how LinoChat can work for your specific use case.
                </p>
              </div>

              <ul className="space-y-4">
                {checklist.map((item, i) => (
                  <motion.li key={i} {...staggerChild(0.15 + i * 0.05)} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-[15px]">{item}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    {...staggerChild(0.3 + i * 0.05)}
                    className="rounded-xl border bg-white/60 p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Trust note */}
              <p className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-4">
                Join 2,000+ businesses already using LinoChat to deliver better customer experiences.
                No commitment required — just a friendly conversation about your needs.
              </p>
            </motion.div>

            {/* Right — Embedded booking form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl border bg-white shadow-lg overflow-hidden"
            >
              <iframe
                src="https://ravolti.com/embed/07601710-edf5-47b9-abe2-a36a51a7072b"
                width="100%"
                height="600"
                frameBorder="0"
                scrolling="no"
                title="Book a Demo"
                style={{ border: 'none', borderRadius: '8px', overflow: 'hidden' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why teams choose LinoChat</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to deliver exceptional support — powered by AI, built for scale.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                {...staggerChild(i * 0.08)}
                className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-1.5">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
