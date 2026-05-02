import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, Calendar, PieChart, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { name: 'Jan', value: 4500 },
  { name: 'Fev', value: 5200 },
  { name: 'Mar', value: 4800 },
  { name: 'Abr', value: 6100 },
];

export default function FinancialSummary({ proposals = [] }) {
  const totalInvested = proposals
    .filter(p => p.status === 'accepted' || p.status === 'completed')
    .reduce((sum, p) => sum + (p.offered_price || 0), 0);

  const pendingInvestment = proposals
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.offered_price || 0), 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative rounded-[2.5rem] bg-white/5 border border-white/10 p-8 overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-secondary/20 transition-colors" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">+12%</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Investimento Total</p>
              <h4 className="text-3xl font-heading font-black tracking-tighter mt-1">R$ {totalInvested.toLocaleString('pt-BR')}</h4>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRight size={12} className="text-secondary" />
              EM RELAÇÃO AO MÊS ANTERIOR
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative rounded-[2.5rem] bg-white/5 border border-white/10 p-8 overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Propostas em Aberto</p>
              <h4 className="text-3xl font-heading font-black tracking-tighter mt-1">R$ {pendingInvestment.toLocaleString('pt-BR')}</h4>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
              <PieChart size={12} className="text-primary" />
              Aguardando confirmação
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-[3rem] bg-white/5 border border-white/5 p-8 md:p-12 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-xl font-heading font-black tracking-tight flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              Evolução Mensal de Custos
            </h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">Visão Geral de Gastos</p>
          </div>
        </div>

        <div className="h-[350px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(value) => `R$ ${value}`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: 'white', fontWeight: 700 }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={4} 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
