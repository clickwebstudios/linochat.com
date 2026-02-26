import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextValue {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  role: 'Agent' | 'Admin' | 'Superadmin';
  stats: { chats: number; tickets: number };
  setStats: (stats: { chats: number; tickets: number }) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
  toggleMobileSidebar: () => {},
  role: 'Agent',
  stats: { chats: 0, tickets: 0 },
  setStats: () => {},
});

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({
  children,
  role = 'Agent',
}: {
  children: ReactNode;
  role?: 'Agent' | 'Admin' | 'Superadmin';
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ chats: 0, tickets: 0 });

  return (
    <LayoutContext.Provider
      value={{
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar: () => setMobileSidebarOpen(prev => !prev),
        role,
        stats,
        setStats,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
