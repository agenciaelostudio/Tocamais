import React from 'react';
import { DollarSign, ArrowUpRight, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total em Gorjetas</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-secondary">R$ {totalTips.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-secondary" />
              Sua melhor semana até agora!
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">R$ {(totalTips * 0.95).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Líquido após taxas da plataforma (5%)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="glass-card p-6 h-[300px]">
        <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
          <BarChartIcon className="w-4 h-4 text-secondary" />
          Ganhos Diários (Esta Semana)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border) / 0.3)" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip 
              cursor={{ fill: 'hsla(var(--primary) / 0.05)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.amount > 300 ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BarChartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
