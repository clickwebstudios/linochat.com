import { Link } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'motion/react';
import { Heart, Lightbulb, Users, Award, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '10K+', label: 'Customers Worldwide' },
    { value: '50M+', label: 'Conversations Handled' },
    { value: '150+', label: 'Countries Served' },
    { value: '200+', label: 'Integrations Available' },
  ];

  const values = [
    {
      icon: <Heart className="h-7 w-7" />,
      title: 'Customer-First',
      description:
        'Every decision we make begins and ends with our customers. Their success is the measure of ours.',
      accent: 'bg-rose-500/10 text-rose-600',
    },
    {
      icon: <Lightbulb className="h-7 w-7" />,
      title: 'Innovation',
      description:
        'We push boundaries relentlessly, embracing new ideas and technology to solve hard problems elegantly.',
      accent: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: 'Empathy',
      description:
        'We listen deeply, understand genuinely, and build software that reflects real human needs.',
      accent: 'bg-sky-500/10 text-sky-600',
    },
    {
      icon: <Award className="h-7 w-7" />,
      title: 'Excellence',
      description:
        'Good enough is never enough. We hold ourselves to the highest standard in everything we ship.',
      accent: 'bg-emerald-500/10 text-emerald-600',
    },
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-founder',
      initials: 'SC',
      bio: 'Former VP of Support at Zenith. Passionate about making world-class customer service accessible to every business.',
      gradient: 'from-primary to-blue-400',
    },
    {
      name: 'Michael Johnson',
      role: 'CTO & Co-founder',
      initials: 'MJ',
      bio: 'Ex-Google engineer with a decade of experience building scalable real-time communication systems.',
      gradient: 'from-violet-600 to-purple-400',
    },
    {
      name: 'Emily Davis',
      role: 'Head of Product',
      initials: 'ED',
      bio: 'Product leader who previously shaped user experiences at Intercom. Obsessed with simplicity and delight.',
      gradient: 'from-rose-500 to-pink-400',
    },
    {
      name: 'David Wilson',
      role: 'Head of Customer Success',
      initials: 'DW',
      bio: 'Built and scaled support teams at three SaaS unicorns. Believes every customer interaction is a chance to create a fan.',
      gradient: 'from-emerald-600 to-teal-400',
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="About Us - Our Mission & Team"
        description="Learn about LinoChat's mission to make exceptional customer support accessible to every business. Meet our team and explore our company values."
        keywords="about us, customer support company, team, mission, values"
        canonical="https://linochat.com/about"
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-blue-50/50 to-violet-50/30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.10] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(circle, #155dfc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-[48px] font-bold leading-tight"
          >
            Built for teams who <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">care</span> about their customers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            We started LinoChat with one belief: exceptional customer support shouldn't require
            exceptional budgets. Today, we're empowering thousands of teams to deliver the kind of
            service their customers deserve.
          </motion.p>
        </div>
      </section>

      {/* Story + Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                Our Story
              </span>
              <h2 className="mt-3 mb-6 text-3xl font-bold">
                From a simple idea to serving 10,000+ companies
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Founded in 2020, LinoChat was born from a simple observation: customer support
                shouldn't be complicated. Our founders, having experienced the frustrations of
                clunky support tools firsthand, set out to build something better.
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                What started as a lightweight chat widget quickly grew into a full-service platform.
                Today, we handle millions of conversations every month for businesses across every
                continent, from ambitious startups to Fortune 500 enterprises.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Backed by leading investors and driven by a world-class team, we're continuously
                innovating to stay ahead of rising customer expectations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-5"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              What Drives Us
            </span>
            <h2 className="mt-3 mb-4 text-3xl font-bold">Our Core Values</h2>
            <p className="text-muted-foreground">
              These principles guide every product decision, every hire, and every customer
              interaction at LinoChat.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center">
                  <CardContent className="p-8">
                    <div
                      className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${value.accent}`}
                    >
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              The People Behind LinoChat
            </span>
            <h2 className="mt-3 mb-4 text-3xl font-bold">Meet Our Leadership</h2>
            <p className="text-muted-foreground">
              A passionate team of builders, operators, and customer advocates united by a shared
              mission.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center">
                  <CardContent className="p-6">
                    <div
                      className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${member.gradient} text-white text-2xl font-bold shadow-lg`}
                    >
                      {member.initials}
                    </div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-blue-600 to-violet-700" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-10 left-20 h-48 w-48 rounded-full bg-white/5 blur-sm" />
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Join Our Growing Team
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              We're always looking for talented, empathetic people who share our mission to make
              customer support better for everyone.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-card text-primary hover:bg-muted/50">
                View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
