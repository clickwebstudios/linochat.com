import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Check } from 'lucide-react';
import { mockPricingPlans } from '../../data/mockData';
import { useState } from 'react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const faqs = [
    { q: 'Can I change plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise.' },
    { q: 'Is there a setup fee?', a: 'No setup fees. Just pay for what you use.' },
    { q: 'Do you offer discounts for annual billing?', a: 'Yes! Save 20% when you pay annually.' },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Pricing - Flexible Plans for Every Team"
        description="LinoChat pricing plans starting from free. Choose the perfect plan for your team. Get started with our 14-day free trial. No credit card required."
        keywords="customer support pricing, helpdesk pricing, live chat pricing, support software cost"
        canonical="https://linochat.com/pricing"
      />
      <MarketingHeader />

      <section className="bg-gradient-to-br from-primary/10 to-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-[48px] font-bold">Flexible Plans for Every Team Size</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Start free, scale as you grow. No hidden fees.
          </p>
          
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{ backgroundColor: billingPeriod === 'annual' ? '#2563eb' : '#d1d5db' }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-card transition-transform ${
                  billingPeriod === 'annual' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
          </div>
          
          {billingPeriod === 'annual' && (
            <p className="text-sm text-green-600 font-medium">
              💰 Save 20% with annual billing
            </p>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockPricingPlans.map((plan) => {
              // Calculate savings for annual billing
              const monthlyCost = plan.priceMonthly.replace('$', '');
              const annualCost = plan.priceAnnual.replace('$', '');
              const showDiscount = billingPeriod === 'annual' && monthlyCost !== 'Custom' && monthlyCost !== '0';
              const monthlySavings = monthlyCost !== 'Custom' && annualCost !== 'Custom' 
                ? (parseFloat(monthlyCost) - parseFloat(annualCost)) * 12 
                : 0;
              
              return (
                <Card
                  key={plan.name}
                  className={`flex flex-col ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}
                >
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                      </span>
                      <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                    </div>
                    {showDiscount && monthlySavings > 0 && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Save ${monthlySavings.toFixed(0)}/year
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-auto ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta === 'Start Free Trial' ? 'Get Started' : plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}