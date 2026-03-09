import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'motion/react';
import {
  MessageCircle,
  Ticket,
  BarChart,
  Zap,
  Users,
  Globe,
  Shield,
  Bot,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { mockTestimonials } from '../../data/mockData';

export default function HomePage() {
  const benefits = [
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: 'Real-time Chat',
      description: 'Connect with customers instantly through our powerful live chat solution.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Multi-channel Support',
      description: 'Manage all customer conversations from email, chat, and social in one place.',
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Scalability',
      description: 'Grow your support team effortlessly with our flexible platform.',
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: 'AI Automation',
      description: 'Let AI handle routine queries so your team can focus on complex issues.',
    },
  ];

  const features = [
    { icon: <MessageCircle />, name: 'Live Chat', desc: 'Real-time messaging' },
    { icon: <Ticket />, name: 'Ticketing', desc: 'Smart ticket management' },
    { icon: <BarChart />, name: 'Analytics', desc: 'Detailed insights' },
    { icon: <Zap />, name: 'Integrations', desc: 'Connect your tools' },
    { icon: <Bot />, name: 'AI Chatbots', desc: 'Automated responses' },
    { icon: <Users />, name: 'Team Collaboration', desc: 'Work together' },
    { icon: <Shield />, name: 'Security', desc: 'Enterprise-grade' },
    { icon: <Clock />, name: '24/7 Support', desc: 'Always available' },
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<2 min', label: 'Avg Response Time' },
    { value: '94%', label: 'CSAT Score' },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Modern Customer Support Platform"
        description="Transform your customer support with LinoChat. AI-powered live chat, ticketing, and helpdesk software designed for growing teams. Start your free trial today."
        keywords="customer support software, helpdesk software, live chat, ticketing system, AI customer service, support platform"
        canonical="https://linochat.com"
      />
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-6 text-[48px] font-bold">
                Elevate Your Customer Support with AI-Powered Chat
              </h1>
              <p className="mb-8 text-xl text-gray-600">
                Deliver exceptional customer service with our all-in-one platform. Manage chats, tickets, and analytics seamlessly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1653212883731-4d5bc66e0181?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHN1cHBvcnQlMjB0ZWFtfGVufDF8fHx8MTc2NjE1NDEyNnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Customer Support Team"
                className="rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      {benefit.icon}
                    </div>
                    <h3 className="mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4">Everything You Need to Delight Customers</h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern support teams
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      {feature.icon}
                    </div>
                    <h4 className="mb-1">{feature.name}</h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4">Trusted by Leading Companies</h2>
            <p className="text-xl text-gray-600">See what our customers say about us</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {mockTestimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="mb-4 text-gray-600 italic">{testimonial.quote}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-gray-500">
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-white">Ready to Transform Your Customer Support?</h2>
          <p className="mb-8 text-xl text-blue-100">
            Join thousands of companies already using LinoChat
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="email"
              placeholder="Enter your work email"
              className="px-4 py-3 rounded-lg w-full sm:w-96 text-gray-900"
            />
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-100">
            ✓ 14-day free trial  ✓ No credit card required
          </p>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}