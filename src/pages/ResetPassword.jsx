import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedButton from '@/components/shared/AnimatedButton';
import GlowOrb from '@/components/shared/GlowOrb';
import Logo from '@/components/shared/Logo';
import ParticleBackground from '@/components/shared/ParticleBackground';
import { getSupabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Senha alterada com sucesso!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-10 md:py-20">
      <ParticleBackground />
      <GlowOrb color="primary" size={600} className="-top-40 -left-40 opacity-40" />
      <GlowOrb color="secondary" size={500} className="-bottom-40 -right-40 opacity-30" delay={1.5} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center -mb-8 md:-mb-16 lg:-mb-24"
          >
            <Logo size="5xl" />
          </motion.div>
          
          <div className="relative z-20 flex flex-col items-center">
            <h1 className="text-4xl font-heading font-black tracking-tighter text-foreground mb-3 uppercase">
              {success ? 'SUCESSO!' : 'NOVA SENHA'}
            </h1>
            <p className="text-muted-foreground text-lg font-medium text-center">
              {success 
                ? 'Sua senha foi atualizada. Redirecionando...' 
                : 'Crie uma nova senha forte para sua conta.'}
            </p>
          </div>
        </div>

        <motion.div
          className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-center font-bold">Tudo pronto! Voce ja pode entrar com sua nova senha.</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary ml-2">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-medium px-6 pr-12"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary ml-2">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-medium px-6 pr-12"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  </div>
                </div>
              </div>

              <AnimatedButton
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-lg tracking-tight hover:scale-[1.02] transition-all"
              >
                {loading ? 'ATUALIZANDO...' : 'ALTERAR SENHA'}
              </AnimatedButton>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
