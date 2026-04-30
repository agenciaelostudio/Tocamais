import React from 'react';
import NotificationBell from '@/components/shared/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu } from 'lucide-react';

export default function Header({ user, onMenuClick }) {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 z-40 glass-card border-b border-border/50 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <Menu size={20} className="text-muted-foreground" />
        </button>
        <div className="hidden lg:block">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bem-vindo de volta,</p>
          <p className="text-sm font-heading font-bold">{user?.full_name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell user={user} />
        <div className="h-8 w-px bg-border/50 mx-1" />
        <Avatar className="h-9 w-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {user?.full_name?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
