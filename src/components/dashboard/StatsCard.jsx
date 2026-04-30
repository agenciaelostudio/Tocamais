import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, trend, color = 'primary', delay = 0 }) {
  const colors = {
    primary: 'from-primary/10 to-primary/5 border-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]',
    secondary: 'from-secondary/10 to-secondary/5 border-secondary/10 shadow-[0_0_15px_rgba(var(--secondary-rgb),0.1)]',
    yellow: 'from-amber-500/10 to-amber-500/5 border-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]',
  };

  const iconColors = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    yellow: 'text-amber-400 bg-amber-400/10',
    pink: 'text-pink-400 bg-pink-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`rounded-2xl border bg-card/40 backdrop-blur-md bg-gradient-to-br ${colors[color]} p-6 transition-all group overflow-hidden relative`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-heading font-black tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl backdrop-blur-xl border border-white/5 shadow-inner ${iconColors[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
}