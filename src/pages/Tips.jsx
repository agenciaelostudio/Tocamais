import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatsCard from '@/components/dashboard/StatsCard';

export default function Tips({ user }) {
  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['tips', user.email],
    queryFn: () => base44.entities.Tip.filter({ artist_email: user.email }, '-created_date'),
  });

  const total = tips.reduce((s, t) => s + (t.amount || 0), 0);
  const thisMonth = tips.filter((t) => {
    const d = new Date(t.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, t) => s + (t.amount || 0), 0);

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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Reconhecimento</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Gorjetas</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed font-medium">
              Acompanhe o carinho e o apoio financeiro que seus fãs enviam diretamente para você.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-6 rounded-[2rem] shadow-xl backdrop-blur-md">
            <p className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.2em] mb-2 text-center">Saldo Acumulado</p>
            <p className="text-3xl font-black text-emerald-500 font-heading tracking-tighter">R$ {total.toLocaleString('pt-BR')}</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatsCard icon={DollarSign} label="Total Recebido" value={`R$ ${total.toLocaleString('pt-BR')}`} color="secondary" delay={0.1} trend="Sempre crescendo" />
          <StatsCard icon={TrendingUp} label="Este Mês" value={`R$ ${monthTotal.toLocaleString('pt-BR')}`} color="primary" delay={0.15} trend="Meta batida!" />
          <StatsCard icon={DollarSign} label="Qtd. de Gorjetas" value={tips.length} color="yellow" delay={0.2} trend="Muitos fãs ativos" />
        </div>

        {/* History Card */}
        <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-3xl mb-2">Histórico <span className="text-secondary">Recente</span></h2>
              <p className="text-muted-foreground text-sm font-medium">Cada contribuição é um aplauso virtual.</p>
            </div>
          </div>

          <div className="relative">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-medium">Carregando histórico...</p>
              </div>
            ) : tips.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]"
              >
                <div className="w-20 h-20 bg-secondary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-secondary/20">
                  <DollarSign className="w-10 h-10 text-secondary opacity-40" />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">O palco está esperando</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto">Você ainda não recebeu gorjetas. Continue brilhando no palco!</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {tips.map((t, i) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }} 
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-secondary/30 hover:bg-white/10 transition-all duration-500 shadow-sm"
                    >
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner group-hover:scale-110 transition-transform">
                          <DollarSign className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <p className="text-lg font-black tracking-tight group-hover:text-secondary transition-colors">{t.fan_name || 'Fã Anônimo'}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {t.created_date && format(new Date(t.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </p>
                            {t.message && (
                              <div className="hidden md:block w-1 h-1 rounded-full bg-white/10" />
                            )}
                            {t.message && (
                              <p className="text-xs text-muted-foreground italic truncate max-w-md font-medium">"{t.message}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end md:gap-8">
                        {t.message && (
                          <p className="md:hidden text-xs text-muted-foreground italic mb-2 font-medium">"{t.message}"</p>
                        )}
                        <span className="text-2xl font-heading font-black text-secondary tracking-tighter">R$ {t.amount?.toLocaleString('pt-BR')}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}