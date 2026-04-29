import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Music } from 'lucide-react';
import AnimatedButton from '@/components/shared/AnimatedButton';
import GlowOrb from '@/components/shared/GlowOrb';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <GlowOrb color="primary" size={300} className="-top-20 -right-20" />
      <GlowOrb color="secondary" size={200} className="-bottom-20 -left-20" delay={1} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 px-4"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-8">Página não encontrada</p>
        <Link to="/">
          <AnimatedButton className="bg-gradient-to-r from-primary to-secondary text-white border-0">
            <Home size={16} className="mr-2" /> Voltar ao início
          </AnimatedButton>
        </Link>
      </motion.div>
    </div>
  );
}