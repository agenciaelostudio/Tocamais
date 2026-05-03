import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const AnimatedButton = forwardRef(({ children, variant = 'default', className = '', onClick, ...props }, ref) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button ref={ref} variant={variant} className={className} {...props} onClick={onClick}>
        {children}
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;