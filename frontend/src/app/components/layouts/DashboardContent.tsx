import { ReactNode } from 'react';

interface DashboardContentProps {
  /**
   * Main content
   */
  children: ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Maximum width constraint
   */
  maxWidth?: 'none' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Dashboard content wrapper with consistent spacing and layout
 * 
 * @example
 * <DashboardContent padding="lg" maxWidth="6xl">
 *   <YourContent />
 * </DashboardContent>
 */
export function DashboardContent({ 
  children, 
  className = '',
  padding = 'md',
  maxWidth = 'full'
}: DashboardContentProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const maxWidthClasses = {
    none: '',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div className={`${paddingClasses[padding]} ${maxWidthClasses[maxWidth]} mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  /**
   * Section title
   */
  title?: string;
  
  /**
   * Section description
   */
  description?: string;
  
  /**
   * Action buttons or controls for the section header
   */
  actions?: ReactNode;
  
  /**
   * Section content
   */
  children: ReactNode;
  
  /**
   * Optional className
   */
  className?: string;
}

/**
 * Dashboard section with optional header and actions
 * 
 * @example
 * <DashboardSection
 *   title="Recent Activity"
 *   description="Your latest interactions"
 *   actions={<Button>View All</Button>}
 * >
 *   <ActivityList />
 * </DashboardSection>
 */
export function DashboardSection({
  title,
  description,
  actions,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between">
          <div>
            {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
