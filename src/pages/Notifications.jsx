import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const typeColors = {
  proposal: 'text-primary',
  tip: 'text-emerald-400',
  review: 'text-yellow-400',
  event: 'text-secondary',
  system: 'text-blue-400',
};

const typeGradients = {
  proposal: 'from-primary/20 to-primary/5',
  tip: 'from-emerald-500/20 to-emerald-500/5',
  review: 'from-yellow-500/20 to-yellow-500/5',
  event: 'from-secondary/20 to-secondary/5',
  system: 'from-blue-500/20 to-blue-500/5',
};

export default function Notifications({ user }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
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
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Central de Alertas</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Notificações <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Reais</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium leading-relaxed">
              {unreadCount > 0 ? `Você tem ${unreadCount} novas mensagens aguardando.` : 'Você está totalmente em dia!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllRead.mutate()}
              className="h-12 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-2 transition-all"
            >
              <Check size={16} /> Limpar Tudo
            </Button>
          )}
        </motion.div>

        {/* Notifications List */}
        <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-medium">Sincronizando alertas...</p>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]"
            >
              <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Bell className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">Silêncio no Palco</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">Você não tem notificações no momento.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {notifications.map((n, i) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const colorClass = typeColors[n.type] || 'text-white';
                  const gradientClass = typeGradients[n.type] || 'from-white/10 to-white/5';
                  
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                      className={`group relative p-6 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden ${
                        n.is_read 
                          ? 'bg-white/2 border-white/5 hover:bg-white/5' 
                          : 'bg-white/10 border-primary/30 shadow-lg shadow-primary/5 hover:bg-white/15'
                      }`}
                    >
                      {!n.is_read && (
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                      )}
                      
                      <div className="flex items-start gap-6">
                        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${colorClass}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <h3 className={`text-lg font-black tracking-tight ${n.is_read ? 'text-foreground/70' : 'text-foreground'}`}>
                              {n.title}
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                              {n.created_date && format(new Date(n.created_date), "dd MMM, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${n.is_read ? 'text-muted-foreground/60' : 'text-muted-foreground font-medium'}`}>
                            {n.message}
                          </p>
                        </div>
                        
                        {!n.is_read && (
                          <div className="pt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}