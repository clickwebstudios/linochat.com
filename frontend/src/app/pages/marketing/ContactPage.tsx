import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export default function ContactPage() {

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer:
        'Most teams are up and running within minutes. Our onboarding wizard guides you through setup, and our support team is standing by if you need help.',
    },
    {
      question: 'Is there a free plan?',
      answer:
        'Yes! LinoChat offers a free forever plan with core features included. No credit card required. Upgrade to a paid plan anytime for advanced features.',
    },
    {
      question: 'Can I switch plans later?',
      answer:
        'Absolutely. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at your next billing cycle.',
    },
    {
      question: 'What kind of support do you provide?',
      answer:
        'All plans include email and live chat support. Professional and Enterprise plans also include a dedicated account manager and priority response times.',
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Contact Us - Get in Touch"
        description="Contact LinoChat for sales, support, or partnership inquiries. Our team is ready to help you transform your customer support experience."
        keywords="contact support, customer service contact, sales inquiry, helpdesk contact"
        canonical="https://linochat.com/contact"
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-blue-50/50 to-violet-50/30" />
          <div className="absolute top-0 right-1/3 h-[400px] w-[600px] rounded-full bg-primary/[0.10] blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-[48px] font-bold"
          >
            Let's start a conversation
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xl text-muted-foreground"
          >
            Have a question, want a demo, or just want to say hello? We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-1">Send us a message</h2>
                  <p className="text-muted-foreground mb-8">
                    Fill out the form below and we'll get back to you within one business day.
                  </p>
                  <form className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input type="email" placeholder="you@company.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="">Select a topic</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        placeholder="Tell us how we can help..."
                        rows={5}
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FAQ Strip */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-bold">Common Questions</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <ChevronRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
