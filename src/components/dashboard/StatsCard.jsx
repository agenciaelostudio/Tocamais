import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, trend, color = 'primary', delay = 0 }) {
  const colors = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    secondary: 'from-secondary/20 to-secondary/5 border-secondary/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',
  };

  const iconColors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    yellow: 'text-yellow-400',
    pink: 'text-pink-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border bg-gradient-to-br ${colors[color]} p-5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {trend && <p className="text-xs text-secondary mt-1">{trend}</p>}
        </div>
        <div className={`p-2.5 rounded-lg bg-background/50 ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}