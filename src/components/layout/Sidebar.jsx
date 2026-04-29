import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Music,
  Calendar,
  MessageSquare,
  Bell,
  Heart,
  Star,
  DollarSign,
  Search,
  Send,
  Store,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { base44 } from '@/api/base44Client';

const navByRole = {
  bar_owner: [
    { label: 'Dashboard', icon: Music, path: '/dashboard' },
    { label: 'Explorar Artistas', icon: Search, path: '/explore' },
    { label: 'Propostas', icon: Send, path: '/proposals' },
    { label: 'Agenda', icon: Calendar, path: '/events' },
    { label: 'Chat', icon: MessageSquare, path: '/chat' },
    { label: 'Meu Bar', icon: Store, path: '/venue' },
  ],
  artist: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Propostas', icon: Send, path: '/proposals' },
    { label: 'Agenda', icon: Calendar, path: '/events' },
    { label: 'Gorjetas', icon: DollarSign, path: '/tips' },
    { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
    { label: 'Chat', icon: MessageSquare, path: '/chat' },
    { label: 'Meu Perfil', icon: Music, path: '/artist-profile' },
  ],
  fan: [
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Shows', icon: Calendar, path: '/events' },
    { label: 'Favoritos', icon: Heart, path: '/favorites' },
    { label: 'Minhas Avaliações', icon: Star, path: '/my-reviews' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Explorar', icon: Search, path: '/explore' },
  ],
};

export default function Sidebar({ userRole, user, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const items = navByRole[userRole] || navByRole.fan;

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <Logo size="sm" />
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : 'group-hover:text-foreground'} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 w-1 h-6 rounded-r-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          to="/notifications"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell size={18} />
          <span>Notificações</span>
        </Link>
        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings size={18} />
          <span>Configurações</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="hidden lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-card border-r border-border transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <NavContent />
      </aside>
    </>
  );
}