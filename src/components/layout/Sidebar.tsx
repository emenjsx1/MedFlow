import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  ClipboardList,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  {
    label: 'Painel do Dia',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff'],
  },
  {
    label: 'Fila de Espera',
    href: '/waitlist',
    icon: ClipboardList,
    roles: ['admin', 'staff'],
  },
  {
    label: 'Mensagens',
    href: '/messages',
    icon: MessageSquare,
    roles: ['admin', 'staff'],
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'staff'],
  },
];

// Itens exclusivos para admin - não aparecem no menu normal
const adminOnlyItems = [
  {
    label: 'Usuários',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(
    (item) => !role || item.roles.includes(role)
  );

  // Admin vê também os itens exclusivos
  const adminItems = role === 'admin' 
    ? adminOnlyItems.filter((item) => item.roles.includes(role))
    : [];

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">AgendaAI</span>
            <p className="text-xs text-sidebar-foreground/60">Gestão de Consultas</p>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border/50" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Admin-only section */}
        {adminItems.length > 0 && (
          <>
            <Separator className="my-3 bg-sidebar-border/50" />
            <p className="px-4 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Administração
            </p>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {role === 'admin' ? 'Administrador' : 'Operador'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
