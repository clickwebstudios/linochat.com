import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Github, Mail } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-xl text-white">LC</span>
              </div>
              <span className="font-bold">LinoChat</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Elevate your customer support with AI-powered chat and seamless multi-channel support.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/features" className="hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              <li><Link to="/features#integrations" className="hover:text-blue-600 transition-colors">Integrations</Link></li>
              <li><Link to="/features#security" className="hover:text-blue-600 transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link to="/about#careers" className="hover:text-blue-600 transition-colors">Careers</Link></li>
              <li><Link to="/resources#blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/help" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li><Link to="/resources#docs" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
              <li><a href="mailto:support@linochat.com" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Mail className="h-4 w-4" /> support@linochat.com
              </a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © 2024 LinoChat. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-blue-600 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}