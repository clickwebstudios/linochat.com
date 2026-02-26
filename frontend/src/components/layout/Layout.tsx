import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  className?: string;
}

/**
 * Main layout wrapper for authenticated pages
 */
export function Layout({ children, showHeader = true, className = '' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      
      <main className={`${showHeader ? 'container py-6' : ''} ${className}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
