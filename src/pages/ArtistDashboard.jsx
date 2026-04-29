import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Send, Calendar, Star, Music, ListMusic } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { MusicRepertoire } from '@/components/MusicRepertoire';
import { SetlistManager } from '@/components/SetlistManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ArtistDashboard({ user }) {
  const { data: profile } = useQuery({
    queryKey: ['artistProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ user_email: user.email });
      return profiles[0];
    },
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals', 'artist', user.email],
    queryFn: () => base44.entities.Proposal.filter({ artist_email: user.email }, '-created_date', 50),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tips', user.email],
    queryFn: () => base44.entities.Tip.filter({ artist_email: user.email }, '-created_date', 50),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'artist', user.email],
    queryFn: () => base44.entities.Event.filter({ artist_email: user.email }, '-event_date', 20),
  });

  const totalTips = tips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const queryClient = useQueryClient();

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Olá, {profile?.stage_name || user.full_name?.split(' ')[0]} 🎸</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas apresentações e acompanhe seus ganhos</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Send} label="Propostas Pendentes" value={pendingProposals.length} color="primary" delay={0.1} />
        <StatsCard icon={DollarSign} label="Total em Gorjetas" value={`R$ ${totalTips.toLocaleString('pt-BR')}`} color="secondary" delay={0.15} />
        <StatsCard icon={Calendar} label="Próximos Shows" value={events.filter((e) => e.status === 'scheduled').length} color="yellow" delay={0.2} />
        <StatsCard icon={Star} label="Avaliação Média" value={profile?.avg_rating?.toFixed(1) || '0.0'} color="pink" delay={0.25} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Gerenciar Repertório</h2>
        <Tabs defaultValue="repertorio">
          <TabsList className="mb-4">
            <TabsTrigger value="repertorio" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Repertório
            </TabsTrigger>
            <TabsTrigger value="setlists" className="flex items-center gap-2">
              <ListMusic className="w-4 h-4" />
              Setlists
            </TabsTrigger>
          </TabsList>
          <TabsContent value="repertorio">
            {profile?.id && <MusicRepertoire artistaId={profile.id} />}
          </TabsContent>
          <TabsContent value="setlists">
            {profile?.id && <SetlistManager artistaId={profile.id} />}
          </TabsContent>
        </Tabs>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Propostas Recentes</h2>
            <Link to="/proposals" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma proposta recebida</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{p.venue_name}</p>
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

        {/* Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Últimas Gorjetas</h2>
            <Link to="/tips" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {tips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma gorjeta recebida</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tips.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{t.fan_name || 'Fã'}</p>
                    {t.message && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.message}</p>}
                  </div>
                  <span className="font-semibold text-secondary">R$ {t.amount?.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}