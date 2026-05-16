import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, User, Bell } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import NotificationBell from '@/components/shared/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header({ user, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/landing';

  const landingLinks = [
    { label: "Recursos", id: "recursos" },
    { label: "Como funciona", id: "como-funciona" },
    { label: "Planos", id: "planos" },
    { label: "Dúvidas", id: "faq" },
  ];

  const handleLinkClick = (id) => {
    if (isLandingPage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/landing#${id}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-[#0f0e12]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 flex items-center">
      {/* Left side: Logo & Menu */}
      <div className="flex items-center gap-4 flex-1">
        {!isLandingPage && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Menu size={20} className="text-white" />
          </button>
        )}
        
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => {
            if (isLandingPage) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/landing');
            }
          }}
        >
          <Logo size="lg" />
        </div>
      </div>

      {/* Center: Navigation Links (Landing Page only) */}
      <div className="hidden md:flex items-center justify-center gap-10 flex-[2]">
        {isLandingPage && landingLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => handleLinkClick(link.id)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right side: Action Button or Profile */}
      <div className="flex items-center justify-end gap-4 flex-1">
        {isLandingPage ? (
          <Link 
            to="/explore"
            className="px-6 py-2.5 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Entrar
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={16} className="text-primary" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Landing Links - Horizontal Scrollable */}
      {isLandingPage && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-[#0f0e12]/90 backdrop-blur-md border-b border-white/5 px-4 h-11 flex items-center gap-8 overflow-x-auto no-scrollbar">
          {landingLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
