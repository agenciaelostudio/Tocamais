import React from 'react';
import { motion } from 'framer-motion';

export default function GlowOrb({ color = 'primary', size = 300, className = '', delay = 0 }) {
  const colorMap = {
    primary: 'bg-primary/20',
    secondary: 'bg-secondary/20',
    mixed: 'bg-gradient-to-br from-primary/20 to-secondary/20',
  };

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${colorMap[color] || colorMap.primary} ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}