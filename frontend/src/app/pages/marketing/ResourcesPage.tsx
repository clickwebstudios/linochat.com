import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, FileText, Video, Download } from 'lucide-react';

export default function ResourcesPage() {
  const blogPosts = [
    { title: '10 Best Practices for Customer Support', category: 'Guide', date: 'Dec 15, 2024' },
    { title: 'How AI is Transforming Support Teams', category: 'Trends', date: 'Dec 10, 2024' },
    { title: 'Reducing Response Times by 50%', category: 'Case Study', date: 'Dec 5, 2024' },
  ];

  const caseStudies = [
    { company: 'TechCorp', metric: '60% faster responses', industry: 'SaaS' },
    { company: 'E-Shop Inc', metric: '95% CSAT score', industry: 'E-commerce' },
    { company: 'FinServe', metric: '40% cost reduction', industry: 'Finance' },
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

      <section className="bg-gradient-to-br from-primary/10 to-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-[48px] font-bold">Resources & Learning</h1>
          <p className="text-xl text-muted-foreground">
            Guides, case studies, and insights to help you succeed
          </p>
        </div>
      </section>

      {/* Blog */}
      <section className="py-16" id="blog">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="mb-4 md:mb-0">Latest from Our Blog</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-10" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.map((post, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm mb-3">
                    {post.category}
                  </div>
                  <h3 className="mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-muted/50" id="case-studies">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, i) => (
              <Card key={i}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{study.metric}</div>
                  <h3 className="mb-1">{study.company}</h3>
                  <p className="text-sm text-muted-foreground">{study.industry}</p>
                  <Button variant="link" className="mt-4">Read Case Study →</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12">Downloadable Resources</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <FileText className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <h4 className="mb-1">Customer Support Playbook</h4>
                  <p className="text-sm text-muted-foreground mb-3">Complete guide to modern support</p>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <Video className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <h4 className="mb-1">Product Demo Webinar</h4>
                  <p className="text-sm text-muted-foreground mb-3">See the platform in action</p>
                  <Button size="sm" variant="outline">Watch Recording</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}