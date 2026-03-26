import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Badge } from '../../components/ui/badge';
import { Search, FileText, ThumbsUp, ThumbsDown, MessageCircle, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';
import { mockArticles } from '../../data/mockData';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Getting Started', icon: <BookOpen />, count: 12 },
    { name: 'Account & Billing', icon: <FileText />, count: 8 },
    { name: 'Features & Usage', icon: <HelpCircle />, count: 15 },
    { name: 'Troubleshooting', icon: <MessageCircle />, count: 10 },
  ];

  const faqs = [
    { q: 'How do I reset my password?', a: 'Click on "Forgot Password" on the login page and follow the email instructions.' },
    { q: 'Can I change my plan anytime?', a: 'Yes! You can upgrade or downgrade your plan from your account settings.' },
    { q: 'How do I contact support?', a: 'Use the chat widget in the bottom right or email support@linochat.com.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use bank-level encryption and are SOC 2 Type II certified.' },
  ];

  return (
    <div className="min-h-screen bg-muted/50">
      <MarketingHeader />

      {/* Hero Search */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-primary-foreground text-[48px] font-bold">How can we help you?</h1>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Search our knowledge base for answers
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for articles, guides, FAQs..."
              className="pl-12 h-14 text-lg bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Popular searches: password reset, billing, integrations
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <h3 className="mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} articles</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2>Popular Articles</h2>
            <Button variant="link">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Badge className="mb-3">{article.category}</Badge>
                  <h3 className="mb-3">{article.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{article.views} views</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {article.helpful}% helpful
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border rounded-lg px-6">
                  <AccordionTrigger className="text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Article Detail View (when clicked) */}
      {searchQuery && (
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-3">Getting Started</Badge>
                    <CardTitle>How to Get Started with LinoChat</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Updated on Dec 15, 2024 • 5 min read
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <h3>Introduction</h3>
                  <p>Welcome to LinoChat! This guide will help you get started with our platform in just a few minutes.</p>
                  
                  <h3>Step 1: Create Your Account</h3>
                  <p>Sign up at our website using your work email. You'll receive a confirmation email to verify your account.</p>
                  
                  <h3>Step 2: Set Up Your Team</h3>
                  <p>Invite team members from your dashboard. You can assign different roles and permissions.</p>
                  
                  <h3>Step 3: Install the Chat Widget</h3>
                  <p>Copy the widget code from your settings and paste it into your website's HTML.</p>
                </div>

                {/* Feedback */}
                <div className="border-t pt-6 mt-6">
                  <p className="mb-4">Was this article helpful?</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Yes
                    </Button>
                    <Button variant="outline" size="sm">
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      No
                    </Button>
                  </div>
                </div>

                {/* Related Articles */}
                <div className="border-t pt-6 mt-6">
                  <h4 className="mb-4">Related Articles</h4>
                  <div className="space-y-2">
                    <a href="#" className="block text-primary hover:underline">→ Installing the Chat Widget</a>
                    <a href="#" className="block text-primary hover:underline">→ Managing Team Members</a>
                    <a href="#" className="block text-primary hover:underline">→ Customizing Your Dashboard</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-primary-foreground">Can't find what you need?</h2>
          <p className="text-xl text-primary-foreground/80 mb-6">
            Our support team is here to help!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-card text-primary hover:bg-muted/50">
              <MessageCircle className="mr-2 h-5 w-5" />
              Start Live Chat
            </Button>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary/90">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}