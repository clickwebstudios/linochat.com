import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import {
  FileText,
  Video,
  Download,
  Play,
  ArrowRight,
  TrendingUp,
  Building2,
  DollarSign,
  Send,
} from 'lucide-react';

export default function ResourcesPage() {
  const blogPosts = [
    {
      title: '10 Best Practices for Customer Support in 2025',
      excerpt:
        'Discover the proven strategies top-performing support teams use to delight customers and drive retention at scale.',
      category: 'Guide',
      date: 'Dec 15, 2024',
      categoryColor: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      title: 'How AI is Transforming Support Teams',
      excerpt:
        'From smart routing to automated responses, explore the AI capabilities reshaping modern customer service.',
      category: 'Trends',
      date: 'Dec 10, 2024',
      categoryColor: 'bg-violet-500/10 text-violet-700',
    },
    {
      title: 'Reducing Response Times by 50%',
      excerpt:
        'A deep dive into how one mid-market SaaS company cut their first-response time in half using LinoChat.',
      category: 'Case Study',
      date: 'Dec 5, 2024',
      categoryColor: 'bg-amber-500/10 text-amber-700',
    },
  ];

  const caseStudies = [
    {
      company: 'TechCorp',
      stat: '60%',
      label: 'faster responses',
      industry: 'SaaS',
      description:
        'TechCorp unified their support channels and leveraged AI-powered routing to dramatically reduce first-response times.',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      company: 'E-Shop Inc',
      stat: '95%',
      label: 'CSAT score',
      industry: 'E-commerce',
      description:
        'By switching to LinoChat, E-Shop Inc achieved a near-perfect customer satisfaction score during their peak holiday season.',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      company: 'FinServe',
      stat: '40%',
      label: 'cost reduction',
      industry: 'Finance',
      description:
        'FinServe automated routine queries with AI chatbots and reallocated their team to high-value interactions.',
      icon: <DollarSign className="h-5 w-5" />,
    },
  ];

  const downloads = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Customer Support Playbook',
      description:
        'The definitive guide to building and scaling a modern customer support operation. 45 pages of actionable frameworks.',
      type: 'PDF',
      action: 'Download PDF',
      actionIcon: <Download className="h-4 w-4" />,
    },
    {
      icon: <Video className="h-8 w-8" />,
      title: 'Product Demo Webinar',
      description:
        'See LinoChat in action. A 30-minute walkthrough of core features, integrations, and real-world workflows.',
      type: 'Video',
      action: 'Watch Recording',
      actionIcon: <Play className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Resources - Guides, Case Studies & Blog"
        description="Explore LinoChat's resource library. Access guides, case studies, webinars, and blog posts to help you deliver exceptional customer support."
        keywords="customer support guides, case studies, support blog, customer service resources"
        canonical="https://linochat.com/resources"
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
            Resources & Insights
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xl text-muted-foreground"
          >
            Learn how to deliver exceptional customer support with guides, case studies, and
            actionable insights from our team.
          </motion.p>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20" id="blog">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Blog
            </span>
            <h2 className="mt-3 text-3xl font-bold">Latest from Our Blog</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Featured post - large */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:row-span-2"
            >
              <Card className="h-full group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl flex items-center justify-center">
                    <FileText className="h-16 w-16 text-primary/40" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <Badge
                      className={`w-fit mb-3 border-0 ${blogPosts[0].categoryColor}`}
                      variant="secondary"
                    >
                      {blogPosts[0].category}
                    </Badge>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {blogPosts[0].title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4 flex-1">
                      {blogPosts[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{blogPosts[0].date}</span>
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Smaller posts */}
            {blogPosts.slice(1).map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 h-full flex flex-col">
                    <Badge
                      className={`w-fit mb-3 border-0 ${post.categoryColor}`}
                      variant="secondary"
                    >
                      {post.category}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-muted/50" id="case-studies">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Proof in the Numbers
            </span>
            <h2 className="mt-3 text-3xl font-bold">Customer Success Stories</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {study.icon}
                      </div>
                      <Badge variant="secondary">{study.industry}</Badge>
                    </div>
                    <div className="text-5xl font-bold text-primary mb-1">{study.stat}</div>
                    <p className="text-sm font-medium text-muted-foreground mb-4">{study.label}</p>
                    <h3 className="text-lg font-semibold mb-2">{study.company}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {study.description}
                    </p>
                    <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read case study <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Free Resources
            </span>
            <h2 className="mt-3 text-3xl font-bold">Downloadable Resources</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {downloads.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                      {item.icon}
                    </div>
                    <Badge variant="secondary" className="mb-3">
                      {item.type}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {item.description}
                    </p>
                    <Button variant="outline" className="gap-2">
                      {item.actionIcon} {item.action}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Send className="h-10 w-10 mx-auto mb-5 text-primary-foreground/80" />
            <h2 className="mb-3 text-3xl font-bold text-primary-foreground">Stay Updated</h2>
            <p className="text-primary-foreground/80 mb-8">
              Get the latest guides, case studies, and product updates delivered straight to your
              inbox. No spam, unsubscribe anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your work email"
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 flex-1"
              />
              <Button size="default" className="bg-card text-primary hover:bg-muted/50">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
