import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperadminSidebar } from '../superadmin/SuperadminSidebar';
import { LayoutProvider } from './LayoutContext';

export default function SuperadminLayout() {
  const [sidebarOpen] = useState(true);

  return (
    <LayoutProvider role="Superadmin">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <SuperadminSidebar sidebarOpen={sidebarOpen} />

        {/* Main Content Area - pages render their own header + content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </LayoutProvider>
  );
}
