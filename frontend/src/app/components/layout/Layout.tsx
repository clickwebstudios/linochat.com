import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-muted/50">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}
