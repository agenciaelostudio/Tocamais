import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, TrendingUp, Users, Trophy, Star, Crown, 
  Calendar, ArrowUpRight, Wallet, Sparkles, Filter, ShieldCheck, Music
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatsCard from '@/components/dashboard/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Tips({ user }) {
  const { data: profile } = useQuery({
    queryKey: ['artistProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
  });

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['gorjetas', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gorjetas')
        .select('*')
        .eq('artista_id', profile.id)
        .eq('arquivado', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const total = tips.reduce((s, t) => s + (t.valor_liquido_artista || 0), 0);
  const thisMonth = tips.filter((t) => {
    const d = new Date(t.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, t) => s + (t.valor_liquido_artista || 0), 0);

  // Group by fan to find top supporters
  const topSupporters = tips.reduce((acc, t) => {
    const name = t.cliente_nome || 'Fã Anônimo';
    if (!acc[name]) acc[name] = { name, total: 0, count: 0 };
    acc[name].total += t.valor_liquido_artista || 0;
    acc[name].count += 1;
    return acc;
  }, {});

  const sortedSupporters = Object.values(topSupporters)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const SUPPORTER_ICONS = [Crown, Trophy, Star];
  const SUPPORTER_COLORS = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-6 md:px-12 py-10 md:py-16">
      {/* Background Decorative Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse-soft" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-10"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Relatório Financeiro</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tightest text-foreground uppercase">
              Minhas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">Gorjetas</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-xl max-w-xl leading-relaxed font-medium opacity-80">
              Gerencie seus ganhos extras e descubra quem são os fãs mais engajados com seu talento.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-50 animate-pulse" />
            <div className="relative bg-white/[0.03] border border-emerald-500/20 px-10 py-8 rounded-[3rem] shadow-2xl backdrop-blur-3xl flex flex-col items-center">
              <p className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.3em] mb-3">Saldo Disponível</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-emerald-500 opacity-60">R$</span>
                 <span className="text-5xl font-black text-white font-heading tracking-tightest leading-none">
                   {total.toLocaleString('pt-BR')}
                 </span>
              </div>
              <Badge className="mt-4 bg-emerald-500 text-white border-0 font-black tracking-widest text-[10px] py-1 px-4">
                <Sparkles className="w-3 h-3 mr-1.5" /> ATUALIZADO
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard icon={DollarSign} label="Volume Total" value={`R$ ${total.toLocaleString('pt-BR')}`} color="emerald" delay={0.1} trend="Sempre crescendo" />
          <StatsCard icon={TrendingUp} label="Este Mês" value={`R$ ${monthTotal.toLocaleString('pt-BR')}`} color="primary" delay={0.15} trend="Acima da média" />
          <StatsCard icon={Users} label="Fãs Apoiadores" value={Object.keys(topSupporters).length} color="secondary" delay={0.2} trend="Fidelidade alta" />
          <StatsCard icon={Wallet} label="Média p/ Tip" value={`R$ ${tips.length ? (total / tips.length).toFixed(2) : '0,00'}`} color="yellow" delay={0.25} trend="Ticket médio" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* History Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[3rem] bg-card/40 border border-white/5 backdrop-blur-3xl p-10 md:p-14 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-4xl mb-2 uppercase tracking-tight">Histórico de <span className="text-primary">Aplausos</span></h2>
                  <p className="text-muted-foreground text-sm font-black uppercase tracking-widest opacity-60">Contribuições recentes via PIX</p>
                </div>
                <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                   <Filter className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="relative">
                {isLoading ? (
                  <div className="py-24 text-center">
                    <div className="relative inline-block">
                       <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                       <DollarSign className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                  </div>
                ) : tips.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[3.5rem] relative group"
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                      <Music className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight uppercase">Palco Silencioso</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto text-lg leading-relaxed">As gorjetas ainda não começaram a cair. Continue encantando seu público!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {tips.map((t, i) => (
                        <motion.div 
                          key={t.id} 
                          initial={{ opacity: 0, x: -30 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.05 }} 
                          className="group flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-white/[0.06] transition-all duration-500 shadow-sm relative"
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                          <div className="flex items-center gap-8 mb-6 md:mb-0">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                              <DollarSign className="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-1.5">
                          <p className="font-black text-2xl tracking-tight group-hover:text-primary transition-colors">{t.cliente_nome || 'Fã Anônimo'}</p>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {t.created_date && format(new Date(t.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                </div>
                                {t.message && (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <p className="text-xs text-muted-foreground font-medium italic opacity-70 truncate max-w-[150px] md:max-w-xs">"{t.message}"</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-3xl font-heading font-black text-white tracking-tightest group-hover:text-emerald-400 transition-colors">R$ {t.valor_liquido_artista?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/40">Confirmado</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Top Supporters Card */}
            <div className="rounded-[3rem] bg-gradient-to-br from-primary/10 via-card/40 to-transparent border border-white/5 backdrop-blur-3xl p-10 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
               
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-heading font-black text-2xl uppercase tracking-tight">Top <span className="text-amber-400">Fans</span></h3>
               </div>

               {sortedSupporters.length > 0 ? (
                 <div className="space-y-6">
                    {sortedSupporters.map((supporter, idx) => {
                       const Icon = SUPPORTER_ICONS[idx] || Star;
                       const color = SUPPORTER_COLORS[idx] || 'text-muted-foreground';
                       return (
                          <div key={supporter.name} className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group/fan">
                             <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${color} group-hover/fan:scale-110 transition-transform`}>
                                <Icon className="w-6 h-6" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-lg font-black tracking-tight truncate">{supporter.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{supporter.count} gorjetas enviadas</p>
                             </div>
                             <div className="text-right">
                                <p className={`text-xl font-black ${color}`}>R$ {supporter.total}</p>
                             </div>
                          </div>
                       );
                    })}
                 </div>
               ) : (
                 <p className="text-muted-foreground font-medium text-center py-10 opacity-40">Nenhum fã no ranking ainda.</p>
               )}

               <Button className="w-full h-14 mt-10 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all">
                  Ver Todos os Apoiadores
               </Button>
            </div>

            {/* Growth Card */}
            <div className="rounded-[3rem] bg-card/20 border border-white/5 p-10 backdrop-blur-md relative overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="font-black text-lg uppercase tracking-tight">Crescimento</h4>
               </div>
               <div className="space-y-6">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                     />
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status Mensal</p>
                        <p className="text-3xl font-black text-white">+15% <span className="text-emerald-400 text-sm">vs mês anterior</span></p>
                     </div>
                     <ArrowUpRight className="w-10 h-10 text-emerald-500 opacity-20" />
                  </div>
               </div>
            </div>

            {/* Security Notice */}
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-start gap-4">
               <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ShieldCheck className="w-4 h-4 text-primary" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Transações Seguras</p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-70">
                    Todas as gorjetas são enviadas diretamente via PIX para sua conta cadastrada. O TocaMais não retém taxas sobre gorjetas.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}