import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';

interface DashboardLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (requireAdmin && !isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate, requireAdmin, isAdmin]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center justify-between px-4">
        <Logo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
