import React from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Search, 
  Send, 
  Calendar, 
  DollarSign, 
  Heart, 
  Star,
  Bell,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const navByRole = {
  bar_owner: [
    { label: 'Painel', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Propostas', icon: Send, path: '/proposals' },
    { label: 'Agenda', icon: Calendar, path: '/events' },
  ],
  artist: [
    { label: 'Painel', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Propostas', icon: Send, path: '/proposals' },
    { label: 'Agenda', icon: Calendar, path: '/events' },
    { label: 'Gorjetas', icon: DollarSign, path: '/tips' },
  ],
  fan: [
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Shows', icon: Calendar, path: '/events' },
    { label: 'Favoritos', icon: Heart, path: '/favorites' },
    { label: 'Avaliações', icon: Star, path: '/my-reviews' },
  ],
  admin: [
    { label: 'Painel', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Explorar', icon: Search, path: '/explore' },
    { label: 'Alertas', icon: Bell, path: '/notifications' },
  ],
};

function isActive(itemPath, currentPath, currentSearch) {
  const [path, search] = itemPath.split("?");
  if (path !== currentPath) return false;
  if (!search) return !currentSearch || currentSearch === "?";
  return currentSearch.includes(search);
}

export function BottomNav({ userRole, badges = {}, onMenuClick, contextAction }) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = navByRole[userRole] || navByRole.fan;

  return (
    <div className="w-full flex justify-center">
      {/* Gradient fade behind the dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none h-24"
        style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.7) 50%, transparent 100%)' }}
      />
      <nav className="fixed bottom-6 z-50 w-[calc(100%-2rem)] max-w-lg" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-3 py-2.5 rounded-2xl bg-background/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, location.pathname, location.search);
            const badgeCount = badges[item.path];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-300 group",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    active && "text-primary"
                  )} strokeWidth={active ? 2.2 : 1.8} />
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-0.5 shadow-sm">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5 transition-all duration-300 truncate w-full px-1 text-center",
                  active ? "font-semibold text-primary" : "font-normal"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {contextAction && (
            <button
              onClick={contextAction.onClick}
              className="relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-300 group text-primary animate-pulse-soft"
            >
              <contextAction.icon className="w-5 h-5" strokeWidth={2.2} />
              <span className="text-[10px] mt-0.5 font-semibold truncate w-full px-1 text-center">
                {contextAction.label}
              </span>
            </button>
          )}

          <button
            onClick={onMenuClick}
            className="relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-300 group text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          >
            <Menu className="w-5 h-5 transition-all duration-300" strokeWidth={1.8} />
            <span className="text-[10px] mt-0.5 transition-all duration-300 truncate w-full px-1 text-center font-normal">
              Menu
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
