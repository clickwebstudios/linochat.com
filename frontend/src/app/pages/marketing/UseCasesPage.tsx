import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { motion } from 'motion/react';
import {
  ShoppingCart,
  Code,
  Stethoscope,
  Wrench,
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Car,
  Plane,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Bot,
  Zap,
  BarChart3,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const useCases = [
  {
    id: 'ecommerce',
    icon: <ShoppingCart className="h-7 w-7" />,
    title: 'E-Commerce & Retail',
    tagline: 'Convert browsers into buyers',
    description: 'Instantly answer product questions, track orders, handle returns, and upsell — 24/7 without adding headcount.',
    stats: [
      { label: 'Faster response', value: '80%' },
      { label: 'Cart abandonment reduction', value: '35%' },
      { label: 'Support cost savings', value: '60%' },
    ],
    benefits: [
      'Instant answers to product sizing, availability, and shipping questions',
      'Automated order tracking and return processing',
      'AI-powered product recommendations based on conversation context',
      'Seamless handover to human agents for complex issues',
    ],
    color: 'from-blue-500/10 to-indigo-500/10',
    borderColor: 'border-blue-500/20',
    iconBg: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'saas',
    icon: <Code className="h-7 w-7" />,
    title: 'SaaS & Technology',
    tagline: 'Scale support without scaling costs',
    description: 'Deflect repetitive technical questions with AI trained on your docs. Focus your engineers on building, not answering "how do I reset my password?"',
    stats: [
      { label: 'Ticket deflection', value: '70%' },
      { label: 'First response time', value: '<30s' },
      { label: 'CSAT improvement', value: '+25%' },
    ],
    benefits: [
      'Auto-generated knowledge base from your documentation',
      'Technical troubleshooting with context-aware AI',
      'Bug report collection with structured ticket creation',
      'Integration with your existing tools via API and webhooks',
    ],
    color: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
    iconBg: 'bg-purple-500/10 text-purple-600',
  },
  {
    id: 'healthcare',
    icon: <Stethoscope className="h-7 w-7" />,
    title: 'Healthcare & Wellness',
    tagline: 'Better patient communication',
    description: 'Handle appointment scheduling, insurance questions, and pre-visit forms — all while maintaining HIPAA awareness in your AI responses.',
    stats: [
      { label: 'Appointment bookings', value: '+45%' },
      { label: 'No-show reduction', value: '30%' },
      { label: 'Admin time saved', value: '50%' },
    ],
    benefits: [
      'Automated appointment scheduling and reminders',
      'Pre-visit form collection and patient intake',
      'Insurance and billing question handling',
      'After-hours support for non-emergency inquiries',
    ],
    color: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'services',
    icon: <Wrench className="h-7 w-7" />,
    title: 'Home Services',
    tagline: 'Book more jobs, answer fewer calls',
    description: 'Let AI handle service inquiries, provide quotes, and book appointments while your team focuses on the work that matters.',
    stats: [
      { label: 'Lead capture rate', value: '3x' },
      { label: 'Booking conversion', value: '+55%' },
      { label: 'After-hours leads', value: '40%' },
    ],
    benefits: [
      'Instant quote estimates based on service descriptions',
      'Automated scheduling integrated with your calendar',
      'Lead capture for after-hours inquiries',
      'Service area and availability checking',
    ],
    color: 'from-orange-500/10 to-amber-500/10',
    borderColor: 'border-orange-500/20',
    iconBg: 'bg-orange-500/10 text-orange-600',
  },
  {
    id: 'education',
    icon: <GraduationCap className="h-7 w-7" />,
    title: 'Education & Training',
    tagline: 'Support students at scale',
    description: 'Answer enrollment questions, provide course information, and guide prospective students through the application process automatically.',
    stats: [
      { label: 'Enrollment inquiries handled', value: '85%' },
      { label: 'Response time', value: 'Instant' },
      { label: 'Staff hours saved/week', value: '20+' },
    ],
    benefits: [
      'Course catalog and program information on demand',
      'Enrollment and application assistance',
      'Financial aid and scholarship FAQs',
      'Campus tour scheduling and event registration',
    ],
    color: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/10 text-cyan-600',
  },
  {
    id: 'realestate',
    icon: <Building2 className="h-7 w-7" />,
    title: 'Real Estate',
    tagline: 'Never miss a hot lead',
    description: 'Qualify leads, answer property questions, and schedule viewings around the clock — even when your agents are showing homes.',
    stats: [
      { label: 'Lead qualification', value: '90%' },
      { label: 'Viewing bookings', value: '+40%' },
      { label: 'Response time', value: '<1min' },
    ],
    benefits: [
      'Property detail inquiries answered instantly',
      'Lead qualification with budget, timeline, and location preferences',
      'Automated viewing and open house scheduling',
      'Neighborhood and market information on demand',
    ],
    color: 'from-rose-500/10 to-pink-500/10',
    borderColor: 'border-rose-500/20',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
  {
    id: 'hospitality',
    icon: <UtensilsCrossed className="h-7 w-7" />,
    title: 'Restaurants & Hospitality',
    tagline: 'Serve guests before they arrive',
    description: 'Handle reservations, menu questions, dietary requirements, and event inquiries without tying up your host stand.',
    stats: [
      { label: 'Reservation bookings', value: '+35%' },
      { label: 'Phone call reduction', value: '50%' },
      { label: 'Guest satisfaction', value: '4.8/5' },
    ],
    benefits: [
      'Online reservation management and confirmation',
      'Menu browsing with dietary and allergy filtering',
      'Event and catering inquiry handling',
      'Multi-language support for international guests',
    ],
    color: 'from-amber-500/10 to-yellow-500/10',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-600',
  },
  {
    id: 'automotive',
    icon: <Car className="h-7 w-7" />,
    title: 'Automotive',
    tagline: 'Drive more test drives',
    description: 'Answer vehicle questions, schedule test drives, and capture trade-in leads — your digital sales assistant that never takes a day off.',
    stats: [
      { label: 'Test drive bookings', value: '+60%' },
      { label: 'Lead response time', value: '<2min' },
      { label: 'After-hours leads captured', value: '45%' },
    ],
    benefits: [
      'Vehicle inventory browsing and comparison',
      'Test drive and service appointment scheduling',
      'Trade-in value estimates and financing pre-qualification',
      'Parts and service department inquiry routing',
    ],
    color: 'from-slate-500/10 to-gray-500/10',
    borderColor: 'border-slate-500/20',
    iconBg: 'bg-slate-500/10 text-slate-600',
  },
  {
    id: 'travel',
    icon: <Plane className="h-7 w-7" />,
    title: 'Travel & Tourism',
    tagline: 'Help travelers 24/7',
    description: 'Handle booking inquiries, itinerary changes, and destination questions across time zones without staffing overnight shifts.',
    stats: [
      { label: 'Booking inquiries resolved', value: '75%' },
      { label: 'Time zone coverage', value: '24/7' },
      { label: 'Customer retention', value: '+20%' },
    ],
    benefits: [
      'Trip planning and destination recommendations',
      'Booking modification and cancellation handling',
      'Travel requirement and visa information',
      'Emergency support and itinerary assistance',
    ],
    color: 'from-sky-500/10 to-indigo-500/10',
    borderColor: 'border-sky-500/20',
    iconBg: 'bg-sky-500/10 text-sky-600',
  },
  {
    id: 'professional',
    icon: <Briefcase className="h-7 w-7" />,
    title: 'Professional Services',
    tagline: 'Qualify leads while you work',
    description: 'Law firms, accounting practices, and consultancies — pre-qualify potential clients and schedule consultations automatically.',
    stats: [
      { label: 'Consultation bookings', value: '+50%' },
      { label: 'Lead qualification rate', value: '85%' },
      { label: 'Admin overhead reduction', value: '40%' },
    ],
    benefits: [
      'Practice area and service information on demand',
      'Client intake form collection',
      'Consultation scheduling with calendar integration',
      'Case status updates for existing clients',
    ],
    color: 'from-indigo-500/10 to-violet-500/10',
    borderColor: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen">
      <SEOHead title="Use Cases" description="See how businesses across industries use LinoChat to automate support and grow faster." />
      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
        <div className="absolute inset-0 -z-10 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div {...fadeUp}>
            <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Use Cases
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-5">
              Built for every industry
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              From e-commerce to healthcare, see how businesses across 10+ industries use LinoChat to automate support, capture leads, and deliver exceptional customer experiences.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: <MessageCircle className="h-4 w-4" />, label: 'AI Chat' },
                { icon: <Bot className="h-4 w-4" />, label: 'Smart Automation' },
                { icon: <Zap className="h-4 w-4" />, label: 'Instant Responses' },
                { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytics' },
              ].map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                  {item.icon} {item.label}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div key={uc.id} id={uc.id} {...fadeUp} transition={{ delay: i * 0.05, duration: 0.5 }}>
                <Card className={`h-full border ${uc.borderColor} hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${uc.color} p-6 pb-5`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl ${uc.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {uc.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{uc.title}</h3>
                            <p className="text-sm text-muted-foreground">{uc.tagline}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      <p className="text-muted-foreground mb-5 leading-relaxed">{uc.description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {uc.stats.map((stat, j) => (
                          <div key={j} className="text-center p-3 rounded-lg bg-muted/50">
                            <div className="text-lg font-bold text-primary">{stat.value}</div>
                            <div className="text-[11px] text-muted-foreground leading-tight">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Benefits */}
                      <ul className="space-y-2">
                        {uc.benefits.map((benefit, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-blue-600 to-violet-700" />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-white mb-4">
              Don't see your industry?
            </h2>
            <p className="text-white/80 mb-8">
              LinoChat works for any business that talks to customers. Get started in minutes and customize the AI for your specific needs.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-xl">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
