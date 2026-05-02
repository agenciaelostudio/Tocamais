import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, MessageSquare, Send, DollarSign, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeIcons = {
  proposal: Send,
  tip: DollarSign,
  review: Star,
  event: Calendar,
  chat: MessageSquare,
  system: Bell,
};

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors group"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-primary animate-pulse-soft' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-background ring-2 ring-primary/20">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 glass-card border border-border/50 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                <h3 className="font-heading font-bold text-sm">Notificações</h3>
                <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-primary hover:underline">
                  Ver todas
                </Link>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {notifications.map((n) => {
                      const Icon = typeIcons[n.type] || Bell;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markRead.mutate(n.id);
                            if (n.link) window.location.href = n.link;
                            setIsOpen(false);
                          }}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-medium">
                              {n.created_date && format(new Date(n.created_date), "dd MMM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
