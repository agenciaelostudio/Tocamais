import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Send, Calendar, Star, Music, ListMusic, TrendingUp, LayoutDashboard, Wallet, ChevronRight, ArrowRight, MapPin, Clock, AlertCircle, CheckCircle2, QrCode, Plus, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import ArtistQRCard from '@/components/dashboard/ArtistQRCard';

export default function ArtistDashboard({ user }) {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState(null);

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

  // Gorjetas confirmadas (tabela gorjetas)
  const { data: gorjetas = [] } = useQuery({
    queryKey: ['gorjetas', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gorjetas')
        .select('*')
        .eq('artista_id', profile.id)
        .eq('arquivado', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Pedidos aguardando confirmação de PIX
  const { data: pedidosAguardando = [] } = useQuery({
    queryKey: ['pedidos-aguardando', profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 15000, // atualiza a cada 15s
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('artista_id', profile.id)
        .in('status', ['aguardando_confirmacao_pix', 'aguardando_pix'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'artist', user.email],
    queryFn: () => base44.entities.Event.filter({ artist_email: user.email }, '-event_date', 20),
  });

  const totalNetTips = gorjetas.reduce((sum, g) => sum + (Number(g.valor_liquido_artista) || 0), 0);
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  const handleConfirmarRecebimento = async (pedidoId) => {
    if (!profile?.id) return;
    setConfirmingId(pedidoId);
    try {
      const { data, error } = await supabase.rpc('confirm_pix_receipt', {
        p_pedido_id: pedidoId,
        p_artista_id: profile.id,
      });
      if (error) throw error;
      if (data?.error) {
        toast.error('Erro ao confirmar: ' + data.message || data.error);
        return;
      }
      toast.success('Gorjeta confirmada! 🎉');
      queryClient.invalidateQueries({ queryKey: ['gorjetas', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-aguardando', profile.id] });
    } catch (err) {
      toast.error('Erro ao confirmar recebimento.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      <SEOHead title="Painel do Artista — TocaMais" description="Gerencie sua agenda, gorjetas e propostas de show." />
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
              <TabsTrigger value="aguardando" className="flex-1 md:flex-none items-center gap-2 px-6 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold relative">
                <AlertCircle size={18} className="text-amber-400" />
                Aguardando PIX
                {pedidosAguardando.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
                    {pedidosAguardando.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="repertorio" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <Music size={18} className="text-secondary" />
                Repertório
              </TabsTrigger>
              <TabsTrigger value="divulgacao" className="flex-1 md:flex-none items-center gap-2 px-8 rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-lg transition-all font-semibold">
                <QrCode size={18} className="text-purple-400" />
                Divulgação
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

          <TabsContent value="divulgacao" className="space-y-8 outline-none">
             <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <ArtistQRCard artistId={profile?.id} artistName={profile?.stage_name} artistSlug={profile?.slug} />
             </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            {/* Quick Resolution List: Pending PIX */}
            {pedidosAguardando.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <h2 className="font-heading font-black text-2xl tracking-tight">PIX para <span className="text-amber-400 underline decoration-amber-400/30">Confirmar</span></h2>
                  </div>
                  <TabsList className="bg-white/5 border border-white/5 h-10 px-4 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 animate-pulse">Confira seu banco antes de clicar</span>
                  </TabsList>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pedidosAguardando.slice(0, 3).map((pedido) => (
                    <motion.div
                      key={pedido.id}
                      layoutId={pedido.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative overflow-hidden p-6 rounded-[2rem] bg-amber-400/5 border-2 border-amber-400/20 hover:border-amber-400/40 transition-all shadow-xl shadow-amber-400/5"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-400 font-black text-xl border border-amber-400/30 shadow-inner group-hover:scale-110 transition-transform">
                          {pedido.cliente_nome?.[0] || 'F'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg text-white truncate">{pedido.cliente_nome || 'Fã Anônimo'}</p>
                          <p className="text-2xl font-black text-amber-400 tracking-tighter">
                            R$ {pedido.valor ? Number(pedido.valor).toLocaleString('pt-BR', {minimumFractionDigits:2}) : '0,00'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-6 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-1.5">
                            <Music className="w-3 h-3" /> Pedido de Música
                         </p>
                         <p className="text-sm font-bold text-white/90 truncate">{pedido.musica || 'Apenas gorjeta'}</p>
                      </div>

                      <Button
                        onClick={() => handleConfirmarRecebimento(pedido.id)}
                        disabled={confirmingId === pedido.id}
                        className="w-full h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-base shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                      >
                        {confirmingId === pedido.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-2">CONFIRMAR RECEBIMENTO <CheckCircle2 className="w-5 h-5" /></span>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                  {pedidosAguardando.length > 3 && (
                    <button 
                      onClick={() => {
                        const trigger = document.querySelector('[value="aguardando"]');
                        if (trigger) trigger.click();
                      }}
                      className="h-full min-h-[150px] rounded-[2rem] border-2 border-dashed border-white/10 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-amber-400 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Ver mais {pedidosAguardando.length - 3} pedidos</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard icon={Send} label="Propostas Pendentes" value={pendingProposals.length} color="primary" delay={0.1} trend="+1 nova hoje" />
              <StatsCard icon={DollarSign} label="Total em Gorjetas" value={`R$ ${totalNetTips.toLocaleString('pt-BR')}`} color="secondary" delay={0.15} trend="Recorde este mês!" />
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

                {gorjetas.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground bg-background/20 rounded-3xl border border-dashed border-white/5">
                    <DollarSign className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40" />
                    <p className="font-medium">Nenhuma gorjeta recebida ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {gorjetas.slice(0, 5).map((t, idx) => (
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

          {/* ===== ABA AGUARDANDO PIX ===== */}
          <TabsContent value="aguardando" className="animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="font-heading font-black text-2xl">Confirmação de <span className="text-amber-400">PIX</span></h2>
                </div>
                <p className="text-muted-foreground text-sm">Estes fãs declararam que fizeram o PIX. Confira no seu app de banco e confirme o recebimento.</p>
              </div>

              {pedidosAguardando.length === 0 ? (
                <div className="text-center py-20 bg-background/20 rounded-[3rem] border border-dashed border-white/10">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20 text-emerald-400" />
                  <p className="text-muted-foreground font-medium">Nenhum PIX aguardando confirmação.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {pedidosAguardando.map((pedido, idx) => (
                      <motion.div
                        key={pedido.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[1.75rem] bg-amber-400/5 border border-amber-400/20 hover:border-amber-400/40 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 text-amber-400 font-black text-lg shrink-0">
                            {pedido.cliente_nome?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="font-black text-base">{pedido.cliente_nome || 'Fã Anônimo'}</p>
                            <p className="text-xs text-muted-foreground italic">{pedido.musica || 'Gorjeta sem pedido'}</p>
                            <p className="text-xs text-amber-400 font-black mt-0.5">
                              {pedido.valor ? `R$ ${Number(pedido.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : 'Valor não informado'}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleConfirmarRecebimento(pedido.id)}
                          disabled={confirmingId === pedido.id}
                          className="shrink-0 h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm border-0 shadow-lg shadow-emerald-500/20"
                        >
                          {confirmingId === pedido.id ? (
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmando...</span>
                          ) : (
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirmar Recebimento</span>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
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
                  <p className="text-3xl font-black text-emerald-500 font-heading tracking-tighter">R$ {totalNetTips.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <TipsSummary tips={gorjetas} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
