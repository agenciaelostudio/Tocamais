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
  Zap,
  Mic2,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { base44 } from '@/api/base44Client';

const navByRole = {
  bar_owner: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Contrate', icon: Music, path: '/marketplace' },
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
    { label: 'Contrate', icon: Music, path: '/marketplace' },
    { label: 'Chat', icon: MessageSquare, path: '/chat' },
    { label: 'Meu Perfil', icon: Mic2, path: '/artist-profile' },
  ],
  fan: [
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Contrate', icon: Music, path: '/marketplace' },
    { label: 'Shows', icon: Calendar, path: '/events' },
    { label: 'Favoritos', icon: Heart, path: '/favorites' },
    { label: 'Minhas Avaliações', icon: Star, path: '/my-reviews' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Contrate', icon: Music, path: '/marketplace' },
  ],
};

export default function Sidebar({ userRole, user, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const items = navByRole[userRole] || navByRole.fan;

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 flex items-center justify-center lg:justify-center relative">
        <Logo size="3xl" variant="sidebar" />
        <button 
          onClick={() => setMobileOpen(false)} 
          className="lg:hidden absolute right-8 p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 group overflow-hidden ${isActive
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
            >
              <item.icon size={20} className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
              <span className="relative z-10">{item.label}</span>
              
              {isActive && (
                <>
                  <motion.div
                    layoutId="nav-active-glow"
                    className="absolute inset-0 bg-primary/5 opacity-50"
                  />
                  <div className="absolute left-0 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        {/* Premium Badge */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 p-4 border border-white/5 backdrop-blur-xl group cursor-pointer hover:scale-[1.02] transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap size={14} className="text-primary animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Tocamais Pro</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold leading-tight">Explore novos recursos e impulsione sua carreira.</p>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-1">
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Settings size={18} />
            <span>Configurações</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 z-40 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-card/60 backdrop-blur-3xl border-r border-white/5 transition-transform duration-500 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}