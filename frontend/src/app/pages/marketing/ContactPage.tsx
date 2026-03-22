import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock, ChevronRight } from 'lucide-react';

export default function ContactPage() {
  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'Email',
      lines: ['support@linochat.com', 'sales@linochat.com'],
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: 'Phone',
      lines: ['+1 (555) 123-4567'],
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Office',
      lines: ['123 Support Street', 'San Francisco, CA 94105'],
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Hours',
      lines: ['Mon-Fri: 9:00 AM - 6:00 PM PST'],
    },
  ];

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer:
        'Most teams are up and running within minutes. Our onboarding wizard guides you through setup, and our support team is standing by if you need help.',
    },
    {
      question: 'Do you offer a free trial?',
      answer:
        'Yes! Every plan comes with a 14-day free trial. No credit card required. Explore all features before you commit.',
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-card py-24">
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
          <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
            {/* Left: Form (3 cols) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
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

            {/* Right: Contact info (2 cols) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-5"
            >
              <h2 className="text-2xl font-bold mb-1">Contact information</h2>
              <p className="text-muted-foreground mb-6">
                Prefer to reach out directly? Here's how to find us.
              </p>

              {contactInfo.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      {item.lines.map((line, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      <ChatWidget />
    </div>
  );
}
