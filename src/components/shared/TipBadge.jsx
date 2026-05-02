import React from 'react';
import { Sparkles, Star, Trophy, Crown, Gem } from 'lucide-react';
import { motion } from 'framer-motion';

const LEVELS = [
  { min: 0,   max: 20,   label: 'Apoiador Bronze', icon: Trophy,  color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20', glow: 'shadow-orange-400/20' },
  { min: 20,  max: 50,   label: 'Apoiador Prata',  icon: Star,    color: 'text-slate-300',   bg: 'bg-slate-300/10',   border: 'border-slate-300/20',  glow: 'shadow-slate-300/20' },
  { min: 50,  max: 100,  label: 'Apoiador Ouro',   icon: Crown,   color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',  glow: 'shadow-amber-400/20' },
  { min: 100, max: 1000, label: 'Apoiador Diamante',icon: Gem,     color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20',   glow: 'shadow-cyan-400/20' },
];

export default function TipBadge({ amount, className = "" }) {
  const level = LEVELS.find(l => amount >= l.min && amount < l.max) || LEVELS[LEVELS.length - 1];
  const Icon = level.icon;

  if (amount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${level.bg} ${level.border} ${className} shadow-lg ${level.glow}`}
    >
      <Icon className={`w-3.5 h-3.5 ${level.color}`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${level.color}`}>
        {level.label}
      </span>
      <Sparkles className={`w-3 h-3 ${level.color} animate-pulse`} />
    </motion.div>
  );
}
