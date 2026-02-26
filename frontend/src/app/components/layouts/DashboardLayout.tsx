import { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}

/**
 * Main dashboard layout component with slot-based composition
 * 
 * @example
 * <DashboardLayout
 *   sidebar={<AdminSidebar />}
 *   header={<DashboardHeader />}
 *   aside={<CustomerDetails />}
 * >
 *   <YourMainContent />
 * </DashboardLayout>
 */
export function DashboardLayout({ sidebar, header, children, aside }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Slot */}
      <aside className="w-24 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Slot (Optional) */}
        {header && (
          <header className="flex-shrink-0 bg-white border-b border-gray-200">
            {header}
          </header>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Primary Content Slot */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Aside Slot (Optional) */}
          {aside && (
            <aside className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
              {aside}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
