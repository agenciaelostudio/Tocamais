import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function AnimatedButton({ children, variant = 'default', className = '', onClick, ...props }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button variant={variant} className={className} {...props} onClick={onClick}>
        {children}
      </Button>
    </motion.div>
  );
}