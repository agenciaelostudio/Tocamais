import React from 'react';
import { DollarSign, ArrowUpRight, TrendingUp, Wallet, BarChart3, Zap, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { motion } from 'framer-motion';

const data = [
  { day: 'Seg', amount: 120 },
  { day: 'Ter', amount: 80 },
  { day: 'Qua', amount: 150 },
  { day: 'Qui', amount: 300 },
  { day: 'Sex', amount: 450 },
  { day: 'Sáb', amount: 600 },
  { day: 'Dom', amount: 200 },
];

export default function TipsSummary({ tips = [] }) {
  const totalTips = tips.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/[0.03] border-white/5 shadow-2xl backdrop-blur-xl rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 blur-3xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Recebido</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black font-heading text-white tracking-tight">R$ {totalTips.toLocaleString('pt-BR')}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mt-3">
                <TrendingUp size={12} className="animate-pulse" />
                Crescimento de 15%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/[0.03] border-white/5 shadow-2xl backdrop-blur-xl rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo Direto</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black font-heading text-white tracking-tight">R$ {totalTips.toLocaleString('pt-BR')}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-3 opacity-60">
                100% para o artista • Taxa Zero
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.2 }}
        className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] h-[340px] shadow-2xl backdrop-blur-md relative"
      >
        <div className="absolute top-8 right-8 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Tempo Real</span>
        </div>

        <h3 className="font-heading font-black text-xl mb-8 flex items-center gap-3 uppercase tracking-tight">
          <BarChart3 className="w-5 h-5 text-secondary" />
          Volume <span className="text-secondary">Semanal</span>
        </h3>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border) / 0.1)" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsla(var(--muted-foreground) / 0.5)', fontSize: 10, fontWeight: 800 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsla(var(--muted-foreground) / 0.5)', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'hsla(var(--primary) / 0.05)', radius: 8 }}
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '12px' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.amount > 300 ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Insight: Sexta é seu dia de pico</span>
           </div>
           <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver detalhes</button>
        </div>
      </motion.div>
    </div>
  );
}
