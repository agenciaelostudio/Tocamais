import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Gorjetas 💸</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas gorjetas recebidas</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={DollarSign} label="Total Recebido" value={`R$ ${total.toLocaleString('pt-BR')}`} color="secondary" delay={0.1} />
        <StatsCard icon={TrendingUp} label="Este Mês" value={`R$ ${monthTotal.toLocaleString('pt-BR')}`} color="primary" delay={0.15} />
        <StatsCard icon={DollarSign} label="Total de Gorjetas" value={tips.length} color="yellow" delay={0.2} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : tips.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhuma gorjeta ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tips.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{t.fan_name || 'Fã'}</p>
                  {t.message && <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">{t.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.created_date && format(new Date(t.created_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-xl font-heading font-bold text-secondary">R$ {t.amount?.toLocaleString('pt-BR')}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}