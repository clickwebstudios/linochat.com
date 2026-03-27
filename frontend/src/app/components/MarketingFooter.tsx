import { Link } from 'react-router-dom';

export default function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-icon.svg" alt="LinoChat" className="h-10 w-10" />
              <span className="font-bold">LinoChat</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              AI-powered customer support platform that helps businesses automate conversations, resolve tickets faster, and deliver exceptional service 24/7.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Talk. Convert. Grow.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/features#integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
              <li><Link to="/features#security" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="font-semibold mb-4">Use Cases</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/use-cases/ecommerce" className="hover:text-primary transition-colors">E-Commerce</Link></li>
              <li><Link to="/use-cases/saas" className="hover:text-primary transition-colors">SaaS & Tech</Link></li>
              <li><Link to="/use-cases/healthcare" className="hover:text-primary transition-colors">Healthcare</Link></li>
              <li><Link to="/use-cases/services" className="hover:text-primary transition-colors">Home Services</Link></li>
              <li><Link to="/use-cases" className="hover:text-primary transition-colors text-primary font-medium">View all →</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LinoChat. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
