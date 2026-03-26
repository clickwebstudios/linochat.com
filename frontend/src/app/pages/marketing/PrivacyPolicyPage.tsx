import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <SEOHead title="Privacy Policy" description="LinoChat Privacy Policy — how we collect, use, and protect your data." />
      <MarketingHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 25, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-foreground">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>LinoChat ("we," "our," or "us") operates the LinoChat platform (linochat.com), an AI-powered customer support solution. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our website, platform, APIs, and embedded chat widget (collectively, the "Service").</p>
            <p>By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name (first and last name)</li>
              <li>Email address</li>
              <li>Password (stored securely using bcrypt hashing)</li>
              <li>Company name and website URL</li>
              <li>Optional: phone number, location, bio, avatar</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Google OAuth Data</h3>
            <p>If you sign in with Google, we request the following OAuth scopes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>openid</code> — to verify your identity</li>
              <li><code>profile</code> — to access your name and profile picture</li>
              <li><code>email</code> — to access your email address</li>
            </ul>
            <p className="mt-3">From these scopes, we receive and store:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google account ID (used solely to link your account)</li>
              <li>Full name (used to populate your profile)</li>
              <li>Email address (used as your account email)</li>
              <li>Profile picture URL (used as your avatar)</li>
            </ul>
            <p className="mt-3"><strong>How we use Google data:</strong> Google user data is used exclusively for authenticating your identity and creating or linking your LinoChat account. We do not access your Google contacts, calendar, drive, files, or any other Google services.</p>
            <p><strong>How we store Google data:</strong> Your Google account ID and profile picture URL are stored in our encrypted database alongside your account record. This data is protected by the same security measures described in Section 5.</p>
            <p><strong>How we delete Google data:</strong> When you delete your LinoChat account, your Google account ID, profile picture URL, and all associated account data are permanently deleted from our systems immediately. Backup copies are purged within 30 days.</p>
            <p><strong>Google API Services User Data Policy:</strong> LinoChat's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
            <p><strong>Limited Use disclosure:</strong> LinoChat's access to Google user data is limited to the practices explicitly disclosed in this privacy policy. Specifically, Google user data received by LinoChat is:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Used only for providing and improving user-facing features (authentication, profile display)</li>
              <li><strong>Not</strong> transferred to third parties, except as necessary to provide the Service or as required by law</li>
              <li><strong>Not</strong> used for serving advertisements, retargeting, or interest-based advertising</li>
              <li><strong>Not</strong> used for creating, training, or improving machine learning or AI models outside of personalized user features</li>
              <li><strong>Not</strong> sold to data brokers, information resellers, or any other third party</li>
              <li><strong>Not</strong> used to determine creditworthiness or for lending purposes</li>
            </ul>
            <p className="mt-3">If you revoke LinoChat's access through your <a href="https://myaccount.google.com/permissions" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Account permissions</a>, your LinoChat account will remain functional using email/password authentication, but your Google-linked sign-in will be disabled.</p>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Customer/Visitor Data (Chat Widget)</h3>
            <p>When end-users interact with the LinoChat widget embedded on our customers' websites, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Chat messages and conversation content</li>
              <li>Name, email, and phone number (if voluntarily provided during conversation)</li>
              <li>Browser type and device type</li>
              <li>Current page URL and referrer URL</li>
              <li>A unique visitor identifier (anonymized, stored in browser localStorage)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.4 Support Ticket Data</h3>
            <p>When support tickets are created (manually or via AI), we collect: customer name, email, phone number, ticket subject, description, and any replies.</p>

            <h3 className="text-lg font-medium mt-4 mb-2">2.5 Usage and Log Data</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address (for security and rate limiting)</li>
              <li>User agent (browser/device information)</li>
              <li>Activity logs (actions performed within the platform)</li>
              <li>Failed login attempts (email, IP, timestamp — for security)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.6 Cookies and Session Data</h3>
            <p>We use session cookies for authentication. Our cookies are:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>HttpOnly:</strong> Not accessible by JavaScript</li>
              <li><strong>Secure:</strong> Only sent over HTTPS</li>
              <li><strong>SameSite: Lax:</strong> Protected against CSRF attacks</li>
            </ul>
            <p>We do not use third-party tracking cookies. We do not use Google Analytics or any third-party analytics service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Authenticate users and manage accounts</li>
              <li>Process and respond to customer support conversations</li>
              <li>Generate AI-powered responses to customer inquiries</li>
              <li>Send transactional emails (password resets, ticket notifications, invitations)</li>
              <li>Monitor and improve platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do <strong>not</strong> use your data for advertising, sell your data to third parties, or use it for purposes unrelated to the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Services</h2>
            <p>We share data with the following third-party services only as necessary to operate the platform:</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold border-b">Service</th>
                    <th className="text-left p-3 font-semibold border-b">Purpose</th>
                    <th className="text-left p-3 font-semibold border-b">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3">OpenAI</td><td className="p-3">AI-powered chat responses</td><td className="p-3">Chat message content (no PII identifiers)</td></tr>
                  <tr className="border-b"><td className="p-3">Google OAuth</td><td className="p-3">User authentication</td><td className="p-3">Email, name, profile picture (from Google)</td></tr>
                  <tr className="border-b"><td className="p-3">Resend</td><td className="p-3">Transactional email delivery</td><td className="p-3">Recipient email, email content</td></tr>
                  <tr className="border-b"><td className="p-3">Pusher</td><td className="p-3">Real-time WebSocket messaging</td><td className="p-3">Chat events, typing indicators</td></tr>
                  <tr><td className="p-3">Expo Push</td><td className="p-3">Mobile push notifications</td><td className="p-3">Device tokens, notification content</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">Optional integrations (configured by account owners): Frubix — if enabled, conversation data and customer contact information may be forwarded to the Frubix platform for appointment scheduling and lead management.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Passwords are hashed using bcrypt (never stored in plaintext)</li>
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>API authentication via Sanctum tokens with expiration</li>
              <li>Rate limiting on sensitive endpoints (login, password reset)</li>
              <li>Account lockout after 5 failed login attempts</li>
              <li>Company data isolation — each company's data is completely separated</li>
              <li>WebSocket channels are authenticated and scoped per user/project</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Retention and Deletion</h2>
            <p>We retain your data for as long as your account is active or as needed to provide the Service.</p>

            <h3 className="text-lg font-medium mt-4 mb-2">6.1 Account Deletion</h3>
            <p>You can delete your account at any time through your account settings in the LinoChat dashboard, or by contacting us at <a href="mailto:privacy@linochat.com" className="text-primary hover:underline">privacy@linochat.com</a>. Upon account deletion, the following data is permanently removed:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account profile data (name, email, phone, avatar, Google account ID)</li>
              <li>All projects, chat conversations, and ticket data</li>
              <li>Knowledge base articles and training documents</li>
              <li>Notification preferences and device tokens</li>
              <li>Authentication tokens and session data (revoked immediately)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">6.2 Google-Specific Data Deletion</h3>
            <p>When you delete your account, all data received from Google APIs is deleted immediately, including your Google account ID and profile picture URL. No Google user data is retained after account deletion, except in encrypted backups which are purged within 30 days.</p>

            <h3 className="text-lg font-medium mt-4 mb-2">6.3 Retained Data</h3>
            <p>Certain data may be retained after account deletion for the following limited purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Encrypted backups:</strong> Purged automatically within 30 days</li>
              <li><strong>Anonymized activity logs:</strong> Retained for security auditing (no PII)</li>
              <li><strong>Legal compliance:</strong> If required by law, specific records may be retained for the legally required period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Update or correct your information via your account settings</li>
              <li><strong>Deletion:</strong> Delete your account and all associated data through the dashboard or by email</li>
              <li><strong>Portability:</strong> Request an export of your data in a standard format</li>
              <li><strong>Objection:</strong> Object to specific processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing under certain conditions</li>
              <li><strong>Revoke consent:</strong> Revoke Google OAuth access at any time via <a href="https://myaccount.google.com/permissions" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Account permissions</a></li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:privacy@linochat.com" className="text-primary hover:underline">privacy@linochat.com</a>. We respond to all requests within 30 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
            <p>The Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If we discover that we have collected data from a child, we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. International Data Transfers</h2>
            <p>Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> <a href="mailto:privacy@linochat.com" className="text-primary hover:underline">privacy@linochat.com</a></li>
              <li><strong>Website:</strong> <a href="https://linochat.com/contact" className="text-primary hover:underline">linochat.com/contact</a></li>
            </ul>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
