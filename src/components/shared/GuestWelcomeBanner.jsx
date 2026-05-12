import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GuestWelcomeBanner({ open, onOpenChange }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="w-full max-w-lg bg-card/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/20 blur-3xl rounded-full" />
          
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-12 text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-[2rem] mx-auto flex items-center justify-center shadow-xl shadow-primary/20 animate-bounce-slow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-black tracking-tight">Valeu pelo apoio! 🤘</h2>
              <p className="text-muted-foreground text-lg">
                Seu pedido foi enviado. Quer acompanhar seus artistas favoritos e ver seu histórico de gorjetas?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left py-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Heart className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Favoritos</p>
                  <p className="text-[10px] text-muted-foreground">Salve artistas que você curte.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Trophy className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Badges</p>
                  <p className="text-[10px] text-muted-foreground">Ganhe conquistas por apoiar.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full h-16 rounded-2xl text-lg font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                onClick={() => window.location.href = '/onboarding'}
              >
                CRIAR MINHA CONTA GRÁTIS
              </Button>
              <button 
                onClick={() => onOpenChange(false)}
                className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all py-2"
              >
                Continuar como visitante
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
