import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Send, Star, Music, TrendingUp, Users, DollarSign, ChevronRight } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CastingList from '@/components/dashboard/CastingList';
import FinancialSummary from '@/components/dashboard/FinancialSummary';

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
    <div className="min-h-screen bg-[#0a090b] relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Estabelecimento</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Painel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Gestão</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed">
              Gerencie a trilha sonora do seu negócio e conecte-se com os melhores artistas.
            </p>
          </div>
          <Link to="/explore">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }} 
              className="relative group overflow-hidden px-8 py-4 rounded-2xl bg-foreground text-background font-bold text-base shadow-2xl transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <Music className="w-5 h-5" /> Explorar Novos Talentos
              </span>
            </motion.button>
          </Link>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8 md:space-y-10">
          <div className="flex items-center justify-center md:justify-start">
            <TabsList className="bg-card/40 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl h-14 w-full md:w-auto shadow-xl">
              <TabsTrigger value="overview" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <TrendingUp size={18} className="text-primary" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="casting" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <Users size={18} className="text-secondary" />
                Casting
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <DollarSign size={18} className="text-emerald-400" />
                Financeiro
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard icon={Send} label="Propostas Pendentes" value={pendingProposals.length} color="primary" delay={0.1} trend="+2 novos hoje" />
              <StatsCard icon={Calendar} label="Shows Agendados" value={upcomingEvents.length} color="secondary" delay={0.15} trend="Próximo show amanhã" />
              <StatsCard icon={Star} label="Avaliação Média" value="4.9" color="yellow" delay={0.2} trend="Nível Ouro" />
              <StatsCard icon={TrendingUp} label="Shows Realizados" value={events.filter((e) => e.status === 'completed').length} color="pink" delay={0.25} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Proposals Card */}
              <div className="group relative rounded-[2rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-xl tracking-tight">Propostas em Aberto</h2>
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
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium">Nenhuma proposta ativa no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {proposals.slice(0, 4).map((p, idx) => (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all group/item cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-background/60 border border-white/10 flex items-center justify-center font-bold text-primary shadow-lg overflow-hidden">
                            {p.artist_avatar ? <img src={p.artist_avatar} className="w-full h-full object-cover" /> : p.artist_name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover/item:text-primary transition-colors">{p.artist_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <Calendar size={12} className="text-primary/70" />
                              {p.event_date && format(new Date(p.event_date), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <p className="font-black text-sm text-foreground tracking-tight">R$ {p.offered_price?.toLocaleString('pt-BR')}</p>
                          <StatusBadge status={p.status} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events Card */}
              <div className="group relative rounded-[2rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                      <Music className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-xl tracking-tight">Próximos Shows</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Calendário Semanal</p>
                    </div>
                  </div>
                  <Link to="/events">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/5 group/btn transition-all">
                      Abrir Agenda <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground bg-background/20 rounded-3xl border border-dashed border-white/5">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium">Sua agenda está livre</p>
                    <button className="text-primary text-sm mt-2 font-bold hover:underline">Agendar primeiro show</button>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {upcomingEvents.slice(0, 4).map((e, idx) => (
                      <motion.div 
                        key={e.id} 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/20 hover:bg-white/10 transition-all group/item cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center border border-secondary/20">
                            <Music className="w-6 h-6 text-secondary" />
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover/item:text-secondary transition-colors">{e.artist_name}</p>
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_rgba(var(--secondary-rgb),0.5)] animate-pulse" />
                              {e.event_date && format(new Date(e.event_date), "dd MMM", { locale: ptBR })}
                              {e.start_time && ` às ${e.start_time}`}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={e.status} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="casting" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
              <div className="mb-10">
                <h2 className="font-heading font-black text-3xl mb-2">Seu Casting <span className="text-primary">Frequente</span></h2>
                <p className="text-muted-foreground">Artistas que já se apresentaram ou têm histórico com você.</p>
              </div>
              <CastingList />
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
              <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-heading font-black text-3xl mb-2">Fluxo de <span className="text-emerald-400">Investimento</span></h2>
                  <p className="text-muted-foreground">Acompanhe seus gastos com música e retorno de engajamento.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl">
                  <p className="text-xs uppercase font-black text-emerald-400 tracking-widest mb-1">Total Investido (Mês)</p>
                  <p className="text-2xl font-black text-emerald-500">R$ 4.250,00</p>
                </div>
              </div>
              <FinancialSummary proposals={proposals} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}