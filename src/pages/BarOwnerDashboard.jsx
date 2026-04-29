import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Send, Star, Music, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function BarOwnerDashboard({ user }) {
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals', 'bar', user.email],
    queryFn: () => base44.entities.Proposal.filter({ bar_owner_email: user.email }, '-created_date', 50),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'bar', user.email],
    queryFn: () => base44.entities.Event.filter({ bar_owner_email: user.email }, '-event_date', 20),
  });

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const upcomingEvents = events.filter((e) => e.status === 'scheduled');

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Olá, {user.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu bar e encontre os melhores artistas</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Send} label="Propostas Pendentes" value={pendingProposals.length} color="primary" delay={0.1} />
        <StatsCard icon={Calendar} label="Próximos Shows" value={upcomingEvents.length} color="secondary" delay={0.15} />
        <StatsCard icon={Star} label="Total Propostas" value={proposals.length} color="yellow" delay={0.2} />
        <StatsCard icon={TrendingUp} label="Shows Realizados" value={events.filter((e) => e.status === 'completed').length} color="pink" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Propostas Recentes</h2>
            <Link to="/proposals" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma proposta ainda</p>
              <Link to="/explore" className="text-primary text-sm hover:underline mt-2 inline-block">Explorar artistas</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{p.artist_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.event_date && format(new Date(p.event_date), "dd MMM yyyy", { locale: ptBR })}
                      {' · '}R$ {p.offered_price?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Events */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Próximos Shows</h2>
            <Link to="/events" className="text-sm text-primary hover:underline">Ver agenda</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum show agendado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{e.artist_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.event_date && format(new Date(e.event_date), "dd MMM", { locale: ptBR })}
                        {e.start_time && ` · ${e.start_time}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}