import { useState, useEffect, useRef } from 'react';
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
  Wrench,
  Home,
  Thermometer,
  Droplets,
  ChevronLeft,
  ChevronRight,
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

interface ChatMessage {
  from: 'customer' | 'ai';
  text: string;
}

interface DemoConversation {
  industry: string;
  icon: React.ReactNode;
  messages: ChatMessage[];
  resolution: string;
  resolutionTime: string;
}

const demoConversations: DemoConversation[] = [
  {
    industry: 'Appliance Repair',
    icon: <Wrench className="h-3.5 w-3.5" />,
    resolution: 'Appointment booked',
    resolutionTime: '45s',
    messages: [
      { from: 'customer', text: 'My dishwasher is leaking from the bottom. Can someone come today?' },
      { from: 'ai', text: "I have a technician available today between 2–4 PM. Should I book that slot for you?" },
      { from: 'customer', text: 'Yes please! That works perfectly.' },
      { from: 'ai', text: "Done! Tech Mike is confirmed for 2–4 PM. You'll get a text when he's en route." },
    ],
  },
  {
    industry: 'Roofing',
    icon: <Home className="h-3.5 w-3.5" />,
    resolution: 'Inspection scheduled',
    resolutionTime: '38s',
    messages: [
      { from: 'customer', text: 'Some shingles blew off in the storm. Do you do free inspections?' },
      { from: 'ai', text: "Yes! I can schedule a free inspection as early as tomorrow morning. What's your address?" },
      { from: 'customer', text: '456 Oak Lane. Morning works great.' },
      { from: 'ai', text: "Booked! Inspector arrives tomorrow 9–11 AM. We'll send photos and a report same day." },
    ],
  },
  {
    industry: 'HVAC',
    icon: <Thermometer className="h-3.5 w-3.5" />,
    resolution: 'Emergency dispatched',
    resolutionTime: '32s',
    messages: [
      { from: 'customer', text: "My AC stopped blowing cold air and it's 95° outside!" },
      { from: 'ai', text: "I have an emergency slot in 2 hours. While you wait, check if your air filter is clogged — that's often the fix." },
      { from: 'customer', text: 'Filter looks really dirty. Please send someone ASAP!' },
      { from: 'ai', text: "Tech Sarah arrives by 3:30 PM. If the filter swap fixes it, we'll waive the visit fee!" },
    ],
  },
  {
    industry: 'Plumbing',
    icon: <Droplets className="h-3.5 w-3.5" />,
    resolution: 'Issue diagnosed',
    resolutionTime: '28s',
    messages: [
      { from: 'customer', text: "Water heater isn't producing hot water. It's only 3 years old." },
      { from: 'ai', text: "Let's check — is the pilot light on? Look for a small blue flame at the bottom of the unit." },
      { from: 'customer', text: 'No flame. Looks like it went out.' },
      { from: 'ai', text: "That's likely it! I can guide you to relight it, or send a plumber today 4–6 PM. What do you prefer?" },
    ],
  },
  {
    industry: 'Scheduling',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    resolution: 'Rescheduled',
    resolutionTime: '22s',
    messages: [
      { from: 'customer', text: 'I need to reschedule my furnace maintenance from Thursday to next week.' },
      { from: 'ai', text: "No problem! I see your appointment for Thursday at 10 AM. I have Monday 9–11 AM or Tuesday 1–3 PM open next week." },
      { from: 'customer', text: "Tuesday afternoon works. Can it be the same technician?" },
      { from: 'ai', text: "Done! Moved to Tuesday 1–3 PM with Tech Dan. You'll get an updated confirmation email shortly." },
    ],
  },
];

function ChatMockup() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const conversation = demoConversations[activeIndex];

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    clearAllTimeouts();
    setVisibleCount(0);
    setIsTyping(false);
    setIsFading(false);

    const msgs = conversation.messages;
    let delay = 600;

    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].from === 'ai') {
        // Show typing indicator before AI messages
        const showTyping = delay;
        timeoutsRef.current.push(setTimeout(() => setIsTyping(true), showTyping));
        delay += 1400;

        const count = i + 1;
        timeoutsRef.current.push(setTimeout(() => {
          setIsTyping(false);
          setVisibleCount(count);
        }, delay));
        delay += 500;
      } else {
        // Customer messages appear after a short pause
        delay += 900;
        const count = i + 1;
        timeoutsRef.current.push(setTimeout(() => {
          setVisibleCount(count);
        }, delay));
        delay += 400;
      }
    }

    // Hold, then fade and advance to next conversation
    timeoutsRef.current.push(setTimeout(() => setIsFading(true), delay + 2500));
    timeoutsRef.current.push(setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % demoConversations.length);
    }, delay + 3000));

    return clearAllTimeouts;
  }, [activeIndex]);

  // Auto-scroll messages container to bottom
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleCount, isTyping]);

  const visibleMessages = conversation.messages.slice(0, visibleCount);
  const allShown = visibleCount === conversation.messages.length;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-primary/40 via-violet-500/30 to-blue-400/35 rounded-3xl blur-2xl" />

      {/* Browser frame */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(21,93,252,0.3)] overflow-hidden">
        {/* Window toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-8 rounded-md bg-slate-700/60 px-3 py-1 text-xs text-slate-400 text-center">
            app.linochat.com
          </div>
        </div>

        <div
          className="bg-card overflow-hidden transition-opacity duration-500"
          style={{ opacity: isFading ? 0 : 1 }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b px-5 py-3.5 bg-slate-50/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">LinoChat AI</div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-[11px] gap-1 shrink-0">
              {conversation.icon}
              {conversation.industry}
            </Badge>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="space-y-3 p-5 bg-muted/30 min-h-[270px] max-h-[270px] overflow-y-auto scroll-smooth">
            {visibleMessages.map((msg, i) => {
              const isLastAi =
                msg.from === 'ai' && allShown && i === visibleMessages.length - 1;

              return (
                <motion.div
                  key={`${activeIndex}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.from === 'customer' ? (
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[75%]">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-sm bg-card border px-4 py-2.5 text-sm max-w-[80%] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isLastAi ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="text-xs font-medium text-green-600">
                                {conversation.resolution} · {conversation.resolutionTime}
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium text-primary">AI Assistant</span>
                            </>
                          )}
                        </div>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-bl-sm bg-card border px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

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

      {/* Conversation navigation dots */}
      <div className="flex justify-center gap-2 mt-5">
        {demoConversations.map((conv, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-primary/25 hover:bg-primary/40'
            }`}
            aria-label={conv.industry}
          />
        ))}
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

// Features data is defined inline in the bento grid for richer visuals

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

function TestimonialSlider({ testimonials }: { testimonials: { quote: string; author: string; role: string; company: string; avatar: string }[] }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 5000);
  };

  useEffect(() => { startAutoPlay(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [total]);

  const goTo = (i: number) => { setCurrent(i); startAutoPlay(); };
  const prev = () => goTo((current - 1 + total) % total);
  const next = () => goTo((current + 1) % total);

  // Show 3 cards at a time on desktop, 1 on mobile
  const getVisible = () => {
    const indices = [];
    for (let i = 0; i < 3; i++) indices.push((current + i) % total);
    return indices;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="hidden md:grid grid-cols-3 gap-6">
        {getVisible().map((idx) => {
          const t = testimonials[idx];
          return (
            <motion.div key={`${idx}-${current}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/20">
                <CardContent className="p-7 flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-foreground leading-relaxed mb-6 flex-1">
                    <span className="text-primary font-serif text-2xl leading-none mr-1">&ldquo;</span>
                    {t.quote}
                    <span className="text-primary font-serif text-2xl leading-none ml-0.5">&rdquo;</span>
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-sm font-bold">{t.avatar}</div>
                    <div>
                      <div className="font-semibold text-sm">{t.author}</div>
                      <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: single card */}
      <div className="md:hidden">
        <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/60">
            <CardContent className="p-7 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-foreground leading-relaxed mb-6">
                <span className="text-primary font-serif text-2xl leading-none mr-1">&ldquo;</span>
                {testimonials[current].quote}
                <span className="text-primary font-serif text-2xl leading-none ml-0.5">&rdquo;</span>
              </p>
              <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-sm font-bold">{testimonials[current].avatar}</div>
                <div>
                  <div className="font-semibold text-sm">{testimonials[current].author}</div>
                  <div className="text-xs text-muted-foreground">{testimonials[current].role}, {testimonials[current].company}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button onClick={prev} className="h-10 w-10 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
        <button onClick={next} className="h-10 w-10 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-violet-500/[0.06]" />
          <div className="absolute top-0 left-1/3 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/[0.12] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[700px] rounded-full bg-violet-500/[0.10] blur-3xl" />
          <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-400/[0.08] blur-3xl" />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
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
                <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Scales</span>
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
              className="relative"
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
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {trustedCompanies.map((name) => (
                <span
                  key={name}
                  className="text-xl font-bold text-muted-foreground/30 tracking-tight select-none hover:text-muted-foreground/60 transition-colors duration-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="border-y bg-gradient-to-r from-primary/[0.04] via-muted/50 to-violet-500/[0.04]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((stat, i) => (
              <motion.div key={i} {...staggerChild(i * 0.08)}>
                <div className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">{stat.value}</div>
                <div className="mt-1.5 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES — BENTO GRID ========== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-primary/[0.05] blur-3xl" />
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto">

            {/* AI Chatbots — large card with mini chat illustration */}
            <motion.div {...staggerChild(0)} className="lg:col-span-2">
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-primary/[0.06] via-blue-50 to-violet-50/50 hover:-translate-y-1">
                <CardContent className="relative p-0 h-full">
                  <div className="flex flex-col lg:flex-row h-full">
                    <div className="p-7 lg:p-8 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                        <Bot className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">AI Chatbots</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Resolve up to 70% of queries instantly with intelligent AI that learns your product inside and out.
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-primary font-medium"><Sparkles className="h-3.5 w-3.5" /> GPT-powered</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Zap className="h-3.5 w-3.5" /> Auto-learning</span>
                      </div>
                    </div>
                    {/* Mini chat illustration */}
                    <div className="lg:w-[260px] p-4 lg:p-5 flex items-end justify-center">
                      <div className="w-full rounded-xl border bg-card/80 backdrop-blur-sm shadow-lg p-3 space-y-2.5 group-hover:shadow-xl transition-shadow">
                        <div className="flex justify-end">
                          <div className="rounded-xl rounded-br-sm bg-primary text-primary-foreground px-3 py-1.5 text-[11px] max-w-[85%]">How do I reset my password?</div>
                        </div>
                        <div className="flex justify-start">
                          <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-1.5 text-[11px] max-w-[85%]">
                            <span className="text-primary font-medium text-[10px]">✨ AI</span><br />Done! Reset link sent to your email.
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="rounded-xl rounded-br-sm bg-primary text-primary-foreground px-3 py-1.5 text-[11px]">That was fast!</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Chat */}
            <motion.div {...staggerChild(0.07)}>
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-green-50/50 hover:-translate-y-1">
                <CardContent className="relative p-7 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-5 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-300">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Live Chat</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    Real-time conversations with customers. Seamless handoff from AI to human agents when needed.
                  </p>
                  {/* Mini status indicators */}
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="flex -space-x-2">
                      {['bg-emerald-500', 'bg-blue-500', 'bg-violet-500'].map((bg, i) => (
                        <div key={i} className={`h-7 w-7 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                          {['SM', 'JD', 'AR'][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 3 agents online
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Smart Ticketing */}
            <motion.div {...staggerChild(0.14)}>
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-violet-50 to-purple-50/50 hover:-translate-y-1">
                <CardContent className="relative p-7 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 mb-5 group-hover:scale-110 group-hover:bg-violet-500/15 transition-all duration-300">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Ticketing</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    Auto-prioritize, categorize, and route tickets to the right agent every time.
                  </p>
                  {/* Mini ticket list */}
                  <div className="space-y-1.5 mt-auto">
                    {[
                      { label: 'High', color: 'bg-red-100 text-red-700', w: 'w-3/4' },
                      { label: 'Med', color: 'bg-amber-100 text-amber-700', w: 'w-1/2' },
                      { label: 'Low', color: 'bg-blue-100 text-blue-700', w: 'w-1/3' },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.color}`}>{t.label}</span>
                        <div className={`h-1.5 rounded-full bg-violet-200/60 ${t.w}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div {...staggerChild(0.21)}>
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-orange-50/50 hover:-translate-y-1">
                <CardContent className="relative p-7 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-5 group-hover:scale-110 group-hover:bg-amber-500/15 transition-all duration-300">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    Track CSAT, resolution times, agent performance, and customer trends in real-time.
                  </p>
                  {/* Mini chart */}
                  <div className="flex items-end gap-1 h-10 mt-auto">
                    {[35, 55, 40, 70, 60, 85, 75, 90, 65, 80].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-amber-400 to-amber-300 group-hover:from-amber-500 group-hover:to-amber-400 transition-colors duration-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Multi-channel */}
            <motion.div {...staggerChild(0.28)}>
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-cyan-50 to-sky-50/50 hover:-translate-y-1">
                <CardContent className="relative p-7 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 mb-5 group-hover:scale-110 group-hover:bg-cyan-500/15 transition-all duration-300">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Multi-channel</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    Email, chat, social, and more — all unified in a single inbox your team will love.
                  </p>
                  {/* Channel pills */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {['Email', 'Chat', 'SMS', 'Social', 'Voice'].map((ch) => (
                      <span key={ch} className="px-2.5 py-1 rounded-full bg-cyan-100/60 text-cyan-700 text-[11px] font-medium">
                        {ch}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Collaboration — large card with mini team illustration */}
            <motion.div {...staggerChild(0.35)} className="lg:col-span-2">
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 via-pink-50/50 to-fuchsia-50/30 hover:-translate-y-1">
                <CardContent className="relative p-0 h-full">
                  <div className="flex flex-col lg:flex-row h-full">
                    <div className="p-7 lg:p-8 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-5 group-hover:scale-110 group-hover:bg-rose-500/15 transition-all duration-300">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Internal notes, mentions, shared views, and collision detection so your team works in perfect sync.
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-rose-600 font-medium"><MessageCircle className="h-3.5 w-3.5" /> @mentions</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Shared views</span>
                      </div>
                    </div>
                    {/* Mini collaboration illustration */}
                    <div className="lg:w-[280px] p-4 lg:p-5 flex items-end justify-center">
                      <div className="w-full space-y-2">
                        <div className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm p-2.5 flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">SM</div>
                          <div>
                            <p className="text-[10px] font-semibold">Sarah M. <span className="font-normal text-muted-foreground">added a note</span></p>
                            <p className="text-[10px] text-muted-foreground">Customer prefers callback after 3 PM</p>
                          </div>
                        </div>
                        <div className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm p-2.5 flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">JD</div>
                          <div>
                            <p className="text-[10px] font-semibold">Jake D. <span className="font-normal text-muted-foreground">is viewing this ticket</span></p>
                            <p className="text-[10px] text-primary">@sarah I'll handle the follow-up</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-muted/40 via-muted/20 to-transparent border-y relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div key={i} {...staggerChild(i * 0.12)} className="relative group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+50px)] right-[calc(-50%+50px)] h-px border-t-2 border-dashed border-primary/20" />
                )}
                <div className="text-center p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
                  <div className="relative inline-flex mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-blue-500/10 to-violet-500/10 text-primary ring-1 ring-primary/10 group-hover:ring-primary/30 group-hover:scale-110 transition-all duration-300">
                      {step.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-violet-500/[0.05] blur-3xl" />
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

          <TestimonialSlider testimonials={mockTestimonials} />
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-blue-600 to-violet-700" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        {/* Decorative floating circles */}
        <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-white/5 blur-sm" />
        <div className="absolute top-1/2 left-1/4 h-20 w-20 rounded-full bg-white/5 blur-sm" />

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
