import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <SEOHead title="Terms of Service" description="LinoChat Terms of Service — rules and guidelines for using our platform." />
      <MarketingHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 25, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-foreground">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using LinoChat (the "Service"), operated by LinoChat ("we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.</p>
            <p>These Terms apply to all visitors, users, and others who access or use the Service, including account holders ("Customers"), their team members ("Agents"), and end-users who interact with the chat widget ("Visitors").</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p>LinoChat is an AI-powered customer support platform that provides:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Embeddable live chat widget for websites</li>
              <li>AI-powered automated responses using large language models</li>
              <li>Agent dashboard for managing customer conversations</li>
              <li>Support ticket management system</li>
              <li>Knowledge base management</li>
              <li>Real-time notifications via WebSocket and push notifications</li>
              <li>Third-party integrations (optional)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 16 years old to create an account</li>
              <li>One person or entity may not maintain more than one free account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Send spam, unsolicited messages, or bulk communications</li>
              <li>Impersonate any person or entity</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Scrape, mine, or collect data from the Service without authorization</li>
              <li>Use the Service for any illegal, fraudulent, or deceptive purposes</li>
              <li>Transmit content that is abusive, threatening, defamatory, or obscene</li>
              <li>Use the AI features to generate harmful, misleading, or illegal content</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. AI-Powered Features</h2>
            <p>Our Service uses artificial intelligence to generate automated responses. You acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI responses are generated algorithmically and may not always be accurate</li>
              <li>You are responsible for reviewing and monitoring AI responses on your platform</li>
              <li>AI-generated content should not be relied upon as professional, legal, medical, or financial advice</li>
              <li>We use third-party AI providers (such as OpenAI) to process chat content</li>
              <li>You should configure your AI system prompt to ensure responses align with your business requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. By using the Service, you consent to the collection and processing of data as described therein.</p>
            <p>As a Customer, you are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Obtaining appropriate consent from your Visitors before collecting their data via the chat widget</li>
              <li>Providing your own privacy policy that discloses the use of LinoChat</li>
              <li>Complying with applicable data protection laws (GDPR, CCPA, etc.)</li>
              <li>Ensuring your use of the Service complies with your jurisdiction's regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Service, including its design, code, features, and branding, is owned by LinoChat</li>
              <li>You retain ownership of all content you submit to the Service (messages, knowledge base articles, etc.)</li>
              <li>You grant us a limited license to use your content solely to provide and improve the Service</li>
              <li>You may not copy, modify, distribute, or reverse-engineer any part of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Payment and Billing</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Free plans are available with limited features</li>
              <li>Paid plans are billed monthly or annually as specified at the time of purchase</li>
              <li>Prices are subject to change with 30 days' notice</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>Failure to pay may result in service suspension or downgrade</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted service. We may:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Perform scheduled maintenance with reasonable advance notice</li>
              <li>Experience unplanned downtime due to technical issues</li>
              <li>Modify, suspend, or discontinue features with notice</li>
            </ul>
            <p>We are not liable for any losses resulting from service interruptions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Third-Party Integrations</h2>
            <p>The Service may integrate with third-party services (Google OAuth, Frubix, etc.). Your use of such integrations is subject to the respective third party's terms and privacy policies. We are not responsible for the practices of third-party services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, LinoChat shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</p>
            <p>Our total liability for any claim arising from the Service is limited to the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Indemnification</h2>
            <p>You agree to indemnify and hold harmless LinoChat, its officers, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Termination</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You may terminate your account at any time from your account settings</li>
              <li>We may terminate or suspend your account for violation of these Terms</li>
              <li>Upon termination, your data will be retained for 30 days before permanent deletion</li>
              <li>Provisions that by their nature should survive termination shall survive</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or an in-app notification at least 30 days before they take effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Governing Law</h2>
            <p>These Terms are governed by the laws of the Province of British Columbia, Canada. Any disputes shall be resolved in the courts of British Columbia.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">16. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> <a href="mailto:legal@linochat.com" className="text-primary hover:underline">legal@linochat.com</a></li>
              <li><strong>Website:</strong> <a href="https://linochat.com/contact" className="text-primary hover:underline">linochat.com/contact</a></li>
            </ul>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
