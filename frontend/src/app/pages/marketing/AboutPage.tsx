import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Users, Target, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  const team = [
    { name: 'Sarah Chen', role: 'CEO & Co-founder', avatar: 'SC' },
    { name: 'Michael Johnson', role: 'CTO & Co-founder', avatar: 'MJ' },
    { name: 'Emily Davis', role: 'Head of Product', avatar: 'ED' },
    { name: 'David Wilson', role: 'Head of Customer Success', avatar: 'DW' },
  ];

  const values = [
    { icon: <Users />, title: 'Customer-First', desc: 'Everything we do starts with our customers' },
    { icon: <Target />, title: 'Innovation', desc: 'We push boundaries to deliver the best solutions' },
    { icon: <Heart />, title: 'Empathy', desc: 'We care deeply about our users and their success' },
    { icon: <Award />, title: 'Excellence', desc: 'We strive for quality in everything we build' },
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

      <section className="bg-gradient-to-br from-primary/10 to-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-[48px] font-bold">About LinoChat</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to make exceptional customer support accessible to every business.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="mb-6 text-center">Our Story</h2>
          <p className="text-muted-foreground mb-4">
            Founded in 2020, LinoChat was born from a simple observation: customer support shouldn't be complicated. Our founders, having experienced the frustrations of clunky support tools firsthand, set out to build something better.
          </p>
          <p className="text-muted-foreground mb-4">
            Today, we serve over 10,000 companies worldwide, from startups to enterprises. Our platform handles millions of customer conversations every month, helping businesses deliver exceptional support at scale.
          </p>
          <p className="text-muted-foreground">
            We're backed by leading investors and continuously innovating to stay ahead of customer expectations.
          </p>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {value.icon}
                  </div>
                  <h4 className="mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                    {member.avatar}
                  </div>
                  <h4 className="mb-1">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground" id="careers">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-primary-foreground">Join Our Team</h2>
          <p className="text-xl text-primary-foreground/80 mb-6">
            We're always looking for talented people who share our mission
          </p>
          <a href="/contact" className="inline-block px-6 py-3 bg-card text-primary rounded-lg hover:bg-muted/50 transition-colors">
            View Open Positions
          </a>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}