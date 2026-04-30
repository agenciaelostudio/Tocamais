import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Send, Calendar, Star, Music, ListMusic, TrendingUp, LayoutDashboard, Wallet, ChevronRight, ArrowRight, MapPin, Clock } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { MusicRepertoire } from '@/components/MusicRepertoire';
import { SetlistManager } from '@/components/SetlistManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TipsSummary from '@/components/dashboard/TipsSummary';

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
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Palco Virtual</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Backstage</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed">
              Gerencie sua carreira, agenda e ganhos em um só lugar.
            </p>
          </div>
          <Link to="/artist-profile">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }} 
              className="relative group overflow-hidden px-8 py-4 rounded-2xl bg-foreground text-background font-bold text-base shadow-2xl transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <Music className="w-5 h-5" /> Editar Perfil Artístico
              </span>
            </motion.button>
          </Link>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8 md:space-y-10">
          <div className="flex items-center justify-center md:justify-start">
            <TabsList className="bg-card/40 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl h-14 w-full md:w-auto shadow-xl overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <LayoutDashboard size={18} className="text-primary" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="repertorio" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <Music size={18} className="text-secondary" />
                Repertório
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <Calendar size={18} className="text-yellow-400" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="ganhos" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <Wallet size={18} className="text-emerald-400" />
                Ganhos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard icon={Send} label="Propostas Pendentes" value={pendingProposals.length} color="primary" delay={0.1} trend="+1 nova hoje" />
              <StatsCard icon={DollarSign} label="Total em Gorjetas" value={`R$ ${totalTips.toLocaleString('pt-BR')}`} color="secondary" delay={0.15} trend="Recorde este mês!" />
              <StatsCard icon={Calendar} label="Próximos Shows" value={events.filter((e) => e.status === 'scheduled').length} color="yellow" delay={0.2} trend="Agenda lotada" />
              <StatsCard icon={Star} label="Avaliação Média" value={profile?.avg_rating?.toFixed(1) || '4.9'} color="pink" delay={0.25} trend="Nível Ouro" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Proposals Card */}
              <div className="group relative rounded-[2rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-xl tracking-tight">Propostas Recentes</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Últimas 48 horas</p>
                    </div>
                  </div>
                  <Link to="/proposals">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/5 group/btn transition-all">
                      Ver todas <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {proposals.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground bg-background/20 rounded-3xl border border-dashed border-white/5">
                    <Send className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40" />
                    <p className="font-medium">Nenhuma proposta recebida</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {proposals.slice(0, 5).map((p, idx) => (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all group/item cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-background/60 border border-white/10 flex items-center justify-center font-black text-primary shadow-lg overflow-hidden">
                            {p.venue_name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover/item:text-primary transition-colors">{p.venue_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <Calendar size={12} className="text-primary/70" />
                              {p.event_date && format(new Date(p.event_date), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tips Card */}
              <div className="group relative rounded-[2rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                      <Wallet className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-xl tracking-tight text-secondary">Últimas Gorjetas</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Seu reconhecimento</p>
                    </div>
                  </div>
                  <Link to="/tips">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/5 group/btn transition-all">
                      Ver histórico <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {tips.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground bg-background/20 rounded-3xl border border-dashed border-white/5">
                    <DollarSign className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40" />
                    <p className="font-medium">Nenhuma gorjeta recebida ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {tips.slice(0, 5).map((t, idx) => (
                      <motion.div 
                        key={t.id} 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/20 hover:bg-white/10 transition-all group/item cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-xs">
                            {t.fan_name?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover/item:text-secondary transition-colors">{t.fan_name || 'Fã Anônimo'}</p>
                            {t.message && <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">"{t.message}"</p>}
                          </div>
                        </div>
                        <span className="font-black text-secondary text-sm">R$ {t.amount?.toLocaleString('pt-BR')}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="repertorio" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
              <div className="mb-10">
                <h2 className="font-heading font-black text-3xl mb-2">Seu <span className="text-secondary">Repertório</span></h2>
                <p className="text-muted-foreground">Gerencie suas músicas e crie setlists para seus shows.</p>
              </div>
              <div className="space-y-12">
                {profile?.id && (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-1 bg-secondary rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Músicas Disponíveis</h3>
                      </div>
                      <MusicRepertoire artistaId={profile.id} />
                    </div>
                    <div className="pt-12 border-t border-white/5 space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-1 bg-primary rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Minhas Setlists</h3>
                      </div>
                      <SetlistManager artistaId={profile.id} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
              <div className="mb-10">
                <h2 className="font-heading font-black text-3xl mb-2">Minha <span className="text-yellow-400">Agenda</span></h2>
                <p className="text-muted-foreground">Acompanhe seus próximos shows e compromissos.</p>
              </div>
              {events.length === 0 ? (
                <div className="text-center py-24 bg-background/20 rounded-[3rem] border border-dashed border-white/10">
                  <Calendar className="w-20 h-20 mx-auto mb-6 opacity-20 text-yellow-400" />
                  <p className="text-lg font-medium text-muted-foreground">Sua agenda está livre por enquanto.</p>
                  <Link to="/proposals" className="inline-block mt-6 text-primary font-bold hover:underline">Ver propostas pendentes</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((e, idx) => (
                    <motion.div 
                      key={e.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white/5 border border-white/5 p-6 hover:border-yellow-400/30 transition-all duration-500"
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex flex-col items-center justify-center border border-yellow-400/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mb-1">
                            {e.event_date && format(new Date(e.event_date), "MMM", { locale: ptBR })}
                          </span>
                          <span className="text-2xl font-black font-heading text-yellow-400 leading-none">
                            {e.event_date && format(new Date(e.event_date), "dd")}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-black text-lg group-hover:text-yellow-400 transition-colors">{e.venue_name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                              <Clock size={12} className="text-yellow-400/70" />
                              {e.start_time || 'A definir'}
                            </p>
                            <StatusBadge status={e.status} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ganhos" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
              <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-heading font-black text-3xl mb-2">Fluxo de <span className="text-emerald-400">Ganhos</span></h2>
                  <p className="text-muted-foreground">Acompanhe seu desempenho financeiro e reconhecimento dos fãs.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-6 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.2em] mb-2">Saldo em Gorjetas</p>
                  <p className="text-3xl font-black text-emerald-500 font-heading tracking-tighter">R$ {totalTips.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <TipsSummary tips={tips} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
