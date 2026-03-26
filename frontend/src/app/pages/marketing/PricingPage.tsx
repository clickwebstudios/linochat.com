import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
} from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'For individuals just getting started',
    priceMonthly: 0,
    priceAnnual: 0,
    period: 'forever',
    popular: false,
    cta: 'Get Started Free',
    ctaLink: '/signup',
    features: [
      '1 agent',
      'Basic live chat',
      '100 tickets/month',
      '7-day chat history',
      'Email support',
    ],
  },
  {
    name: 'Starter',
    description: 'For small teams scaling up',
    priceMonthly: 19,
    priceAnnual: 15,
    period: 'user/mo',
    popular: false,
    cta: 'Get Started Free',
    ctaLink: '/signup?plan=starter',
    features: [
      'Up to 5 agents',
      'Unlimited live chats',
      'Unlimited tickets',
      '30-day chat history',
      'Basic analytics',
      'Email & chat support',
    ],
  },
  {
    name: 'Pro',
    description: 'For growing businesses',
    priceMonthly: 49,
    priceAnnual: 39,
    period: 'user/mo',
    popular: true,
    cta: 'Get Started Free',
    ctaLink: '/signup?plan=pro',
    features: [
      'Unlimited agents',
      'AI-powered chatbots',
      'Advanced analytics & reports',
      'Priority support',
      'Custom integrations',
      'SLA management',
      'API access',
      'Team collaboration tools',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: -1,
    priceAnnual: -1,
    period: '',
    popular: false,
    cta: 'Contact Sales',
    ctaLink: '/contact',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom AI model training',
      'White-label solution',
      'GDPR compliance tools',
      '24/7 phone support',
      'Custom SLA',
      'On-premise deployment option',
    ],
  },
];

type FeatureAvailability = boolean | string;

interface ComparisonFeature {
  name: string;
  free: FeatureAvailability;
  starter: FeatureAvailability;
  pro: FeatureAvailability;
  enterprise: FeatureAvailability;
}

const comparisonFeatures: ComparisonFeature[] = [
  { name: 'Agents', free: '1', starter: 'Up to 5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Tickets', free: '100/mo', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Chat history', free: '7 days', starter: '30 days', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'AI chatbot', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Analytics', free: false, starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
  { name: 'Integrations', free: false, starter: false, pro: 'Custom', enterprise: 'Custom' },
  { name: 'SLA management', free: false, starter: false, pro: true, enterprise: 'Custom' },
  { name: 'Priority support', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Custom branding', free: false, starter: false, pro: false, enterprise: true },
  { name: 'API access', free: false, starter: false, pro: true, enterprise: true },
  { name: 'White-label', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Dedicated account manager', free: false, starter: false, pro: false, enterprise: true },
  { name: '24/7 phone support', free: false, starter: false, pro: false, enterprise: true },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference for the remainder of your billing cycle. When downgrading, the new rate applies at the start of your next billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers. For Enterprise plans, we also support invoicing with NET 30 payment terms.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No! There are no setup fees, no hidden costs, and no surprises. You only pay for the plan you choose. Our Free plan is truly free forever — no credit card required.',
  },
  {
    q: 'Do you offer discounts for nonprofits or startups?',
    a: 'Yes, we offer special pricing for registered nonprofits, educational institutions, and early-stage startups. Contact our sales team to learn more about our discount programs.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes! You can upgrade or downgrade at any time from your account settings. Changes take effect immediately, and billing is prorated.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of your current billing period, and you won\'t be charged again.',
  },
];

function FeatureCell({ value }: { value: FeatureAvailability }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-primary mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Pricing - Simple, Transparent Plans for Every Team"
        description="LinoChat pricing plans starting from free. Choose the perfect plan for your team. Free forever plan available. No credit card required."
        keywords="customer support pricing, helpdesk pricing, live chat pricing, support software cost, LinoChat plans"
        canonical="https://linochat.com/pricing"
      />
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-blue-50/50 to-violet-50/30" />
          <div className="absolute top-0 left-1/3 h-[400px] w-[600px] rounded-full bg-primary/[0.08] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[500px] rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-4 text-[48px] font-bold">
              Simple, transparent <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
              Start free, upgrade when you're ready.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-10"
          >
            <span
              className={`text-sm font-medium transition-colors ${
                !isAnnual ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span
              className={`text-sm font-medium transition-colors ${
                isAnnual ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Annual
            </span>
            <Badge className="bg-green-500/15 text-green-700 border-green-500/20 hover:bg-green-500/15">
              Save 20%
            </Badge>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 -mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, index) => {
              const isEnterprise = plan.name === 'Enterprise';
              const isPro = plan.popular;
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const isCustom = price === -1;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex ${isPro ? 'lg:-mt-4 lg:mb-[-16px]' : ''}`}
                >
                  <Card
                    className={`flex flex-col w-full relative overflow-hidden ${
                      isPro
                        ? 'border-2 border-primary shadow-xl shadow-primary/10'
                        : isEnterprise
                        ? 'bg-foreground text-background border-foreground'
                        : ''
                    }`}
                  >
                    {isPro && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg px-3 py-1 text-xs">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-0">
                      <div className="flex items-center gap-2">
                        {isEnterprise && (
                          <Building2 className="h-5 w-5 text-background/70" />
                        )}
                        <CardTitle
                          className={`text-lg font-semibold ${
                            isEnterprise ? 'text-background' : ''
                          }`}
                        >
                          {plan.name}
                        </CardTitle>
                      </div>
                      <CardDescription
                        className={
                          isEnterprise ? 'text-background/60' : ''
                        }
                      >
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 pt-4">
                      {/* Price */}
                      <div className="mb-6">
                        {isCustom ? (
                          <div>
                            <span
                              className={`text-4xl font-bold ${
                                isEnterprise ? 'text-background' : ''
                              }`}
                            >
                              Custom
                            </span>
                            <p
                              className={`text-sm mt-1 ${
                                isEnterprise
                                  ? 'text-background/60'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              Tailored to your needs
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span
                                className={`text-4xl font-bold ${
                                  isEnterprise ? 'text-background' : ''
                                }`}
                              >
                                ${price}
                              </span>
                              {plan.period && (
                                <span
                                  className={`text-sm ${
                                    isEnterprise
                                      ? 'text-background/60'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  /{plan.period}
                                </span>
                              )}
                            </div>
                            {price === 0 && (
                              <p
                                className={`text-sm mt-1 ${
                                  isEnterprise
                                    ? 'text-background/60'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                Free forever
                              </p>
                            )}
                            {isAnnual && plan.priceMonthly > 0 && (
                              <p className="text-sm mt-1 text-muted-foreground">
                                <span className="line-through">
                                  ${plan.priceMonthly}
                                </span>
                                <span className="text-green-600 font-medium ml-1.5">
                                  Save ${(plan.priceMonthly - plan.priceAnnual) * 12}/yr
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <Check
                              className={`h-4 w-4 mt-0.5 shrink-0 ${
                                isPro
                                  ? 'text-primary'
                                  : isEnterprise
                                  ? 'text-background/70'
                                  : 'text-green-600'
                              }`}
                            />
                            <span
                              className={
                                isEnterprise ? 'text-background/80' : ''
                              }
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link to={plan.ctaLink} className="mt-auto">
                        {isPro ? (
                          <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                            {plan.cta}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : isEnterprise ? (
                          <Button
                            variant="outline"
                            className="w-full border-background/30 text-background hover:bg-background/10 hover:text-background"
                            size="lg"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {plan.cta}
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" size="lg">
                            {plan.cta}
                          </Button>
                        )}
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Start with our free plan. No credit card required. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-3xl font-bold">Compare plans in detail</h2>
            <p className="text-muted-foreground text-lg">
              Find the perfect plan for your team's needs
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold text-sm w-[200px]">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-sm">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-sm">
                    Starter
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      Pro
                      <Sparkles className="h-4 w-4 text-primary" />
                    </span>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-sm">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={`border-b last:border-b-0 ${
                      index % 2 === 0 ? 'bg-card/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-sm font-medium">
                      {feature.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={feature.free} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={feature.starter} />
                    </td>
                    <td className="py-3.5 px-4 text-center bg-primary/5">
                      <FeatureCell value={feature.pro} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={feature.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-3xl font-bold">Frequently asked questions</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about our pricing
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative py-20 overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-blue-600 to-violet-700" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-white/5 blur-sm" />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Get started with LinoChat today
            </h2>
            <p className="mb-8 text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of support teams already using LinoChat to deliver
              exceptional customer experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 px-8"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground px-8"
                >
                  Talk to Sales
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/70">
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
