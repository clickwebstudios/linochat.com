import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Bot, Shield, Check } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Features - Advanced Customer Support Tools"
        description="Explore LinoChat's comprehensive features: live chat, ticketing system, AI chatbots, analytics, and team collaboration tools. Built for modern support teams."
        keywords="live chat features, ticketing system, customer support tools, AI chatbot, help desk features"
        canonical="https://linochat.com/features"
      />
      <MarketingHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-[48px] font-bold">Powerful Features for Modern Support Teams</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to deliver exceptional customer service, all in one platform.
          </p>
        </div>
      </section>

      {/* Tabbed Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8">
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
              <TabsTrigger value="ticketing">Ticketing</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="ai">AI & Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="mb-4">Live Chat Widget</h2>
                  <p className="text-muted-foreground mb-6">
                    Engage customers in real-time with customizable chat widgets that match your brand.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>Custom branding and themes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>Proactive chat triggers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>File sharing and screenshots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>Visitor tracking and analytics</span>
                    </li>
                  </ul>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <img
                      src="https://images.unsplash.com/photo-1659018966825-43297e655ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2NjIwNTk5MHww&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Chat Widget"
                      className="rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ticketing">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Automated Ticket Routing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Intelligent ticket assignment based on skills, availability, and workload.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Priority-based routing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">SLA management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Custom workflows</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Work together seamlessly with internal notes, @mentions, and ticket sharing.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Private notes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Team mentions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Ticket merging</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="knowledge">
              <Card>
                <CardContent className="p-8">
                  <h3 className="mb-4">Self-Service Knowledge Base</h3>
                  <p className="text-muted-foreground mb-6">
                    Empower customers to find answers themselves with AI-powered search and comprehensive articles.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="mb-2">AI-Powered Search</h4>
                      <p className="text-sm text-muted-foreground">
                        Smart search with autocomplete and suggested articles
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2">Article Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Track views, ratings, and search terms
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2">Multi-language</h4>
                      <p className="text-sm text-muted-foreground">
                        Support customers in their language
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-8">
                  <h3 className="mb-4">Comprehensive Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Make data-driven decisions with real-time insights and custom reports.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4>Real-time Metrics</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Active conversations</li>
                        <li>• Response times</li>
                        <li>• Resolution rates</li>
                        <li>• Customer satisfaction scores</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4>Custom Reports</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Agent performance</li>
                        <li>• Ticket trends</li>
                        <li>• Peak hour analysis</li>
                        <li>• Export to CSV/PDF</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="text-center mb-8">
                <h3 className="mb-4">Connect Your Favorite Tools</h3>
                <p className="text-muted-foreground">
                  Seamlessly integrate with 100+ apps and services
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['Salesforce', 'Slack', 'Shopify', 'Zendesk', 'HubSpot', 'Stripe', 'Gmail', 'Zapier'].map((app) => (
                  <Card key={app} className="text-center">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                        <span className="font-semibold text-muted-foreground">{app[0]}</span>
                      </div>
                      <p className="text-sm">{app}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      AI Chatbots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Train custom AI bots to handle common queries 24/7.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Natural language understanding</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Smart handoff to human agents</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Continuous learning</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Automation Workflows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Automate repetitive tasks and focus on what matters.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Auto-responses</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Ticket tagging</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Escalation rules</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="mb-4">Enterprise-Grade Security</h2>
            <p className="text-xl text-muted-foreground">
              Your data is protected with industry-leading security standards
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <h4 className="mb-2">GDPR Compliant</h4>
                <p className="text-sm text-muted-foreground">Full compliance tools</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <h4 className="mb-2">256-bit SSL</h4>
                <p className="text-sm text-muted-foreground">Bank-level encryption</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <h4 className="mb-2">SOC 2 Type II</h4>
                <p className="text-sm text-muted-foreground">Certified secure</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <h4 className="mb-2">99.9% Uptime</h4>
                <p className="text-sm text-muted-foreground">Guaranteed SLA</p>
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