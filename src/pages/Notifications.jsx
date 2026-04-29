import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Send, DollarSign, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeIcons = {
  proposal: Send,
  tip: DollarSign,
  review: Star,
  event: Calendar,
  system: Bell,
};

export default function Notifications({ user }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50),
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Notificações 🔔</h1>
          <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check size={14} className="mr-1" /> Marcar todas como lidas
          </Button>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${n.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                    <Icon size={16} className={n.is_read ? 'text-muted-foreground' : 'text-primary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-muted-foreground' : ''}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.created_date && format(new Date(n.created_date), "dd MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}