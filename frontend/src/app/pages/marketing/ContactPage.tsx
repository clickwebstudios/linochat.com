import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import ChatWidget from '../../components/ChatWidget';
import SEOHead from '../../components/SEOHead';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Contact Us - Get in Touch"
        description="Contact LinoChat for sales, support, or partnership inquiries. Our team is ready to help you transform your customer support experience."
        keywords="contact support, customer service contact, sales inquiry, helpdesk contact"
        canonical="https://linochat.com/contact"
      />
      <MarketingHeader />

      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-[48px] font-bold">Get in Touch</h1>
          <p className="text-xl text-gray-600">
            We'd love to hear from you. Reach out anytime!
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="mb-6">Send Us a Message</h2>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Name</label>
                    <Input placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Email</label>
                    <Input type="email" placeholder="you@company.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2">Subject</label>
                  <Input placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Message</label>
                  <Textarea placeholder="Tell us more..." rows={6} />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="mb-6">Contact Information</h2>
              
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Mail className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="mb-1">Email</h4>
                    <p className="text-sm text-gray-600">support@linochat.com</p>
                    <p className="text-sm text-gray-600">sales@linochat.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Phone className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="mb-1">Phone</h4>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-600">+1 (555) 765-4321</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="mb-1">Office</h4>
                    <p className="text-sm text-gray-600">
                      123 Support Street<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <Clock className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="mb-1">Support Hours</h4>
                    <p className="text-sm text-gray-600">Mon-Fri: 9:00 AM - 6:00 PM PST</p>
                    <p className="text-sm text-gray-600">Weekend: Emergency support only</p>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map would be embedded here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}