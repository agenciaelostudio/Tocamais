import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Beer, Heart, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AnimatedButton from '@/components/shared/AnimatedButton';
import GlowOrb from '@/components/shared/GlowOrb';
import Logo from '@/components/shared/Logo';
import ParticleBackground from '@/components/shared/ParticleBackground';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const roles = [
  {
    id: 'bar_owner',
    icon: Beer,
    title: 'Casa de Show',
    desc: 'Contrate artistas para o seu estabelecimento',
    gradient: 'from-primary to-purple-400',
  },
  {
    id: 'artist',
    icon: Music,
    title: 'Artista',
    desc: 'Gerencie sua agenda e receba propostas',
    gradient: 'from-secondary to-emerald-300',
  },
  {
    id: 'fan',
    icon: Heart,
    title: 'Contratante particular',
    desc: 'Descubra artistas e acompanhe shows',
    gradient: 'from-pink-500 to-rose-400',
  },
];

export default function Onboarding({ user, onComplete, authError }) {
  const isGuest = !user;
  const [step, setStep] = useState(isGuest ? 1 : 2);
  const [authMode, setAuthMode] = useState('signup');
  const [selectedRole, setSelectedRole] = useState(user?.role || '');
  const [formData, setFormData] = useState({
    city: user?.city || '',
    state: user?.state || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [signupData, setSignupData] = useState({
    full_name: user?.full_name || '',
    email: '',
    password: '',
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setSelectedRole(user.role || '');
    setFormData({
      city: user.city || '',
      state: user.state || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
    setSignupData((current) => ({
      ...current,
      full_name: user.full_name || '',
    }));
  }, [user]);

  const handleAuthenticatedFinish = async () => {
    setLoading(true);

    try {
      await base44.auth.updateMe({
        role: selectedRole,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        bio: formData.bio,
        onboarding_complete: true,
      });

      onComplete?.();
      toast.success('Perfil configurado com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel concluir o onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignup = async () => {
    setLoginErrorMessage('');

    if (!selectedRole) {
      toast.error('Escolha um perfil para continuar.');
      return;
    }

    if (!signupData.full_name || !signupData.email || !signupData.password) {
      toast.error('Preencha nome, email e senha.');
      return;
    }

    setLoading(true);

    try {
      const response = await base44.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.full_name,
            role: selectedRole,
            city: formData.city,
            state: formData.state,
            phone: formData.phone,
            bio: formData.bio,
            onboarding_complete: true,
          },
        },
      });

      if (response.session) {
        toast.success('Conta criada com sucesso!');
        window.location.href = '/dashboard';
        return;
      }

      toast.success('Conta criada. Confirme seu email e depois entre.');
      setAuthMode('login');
      setLoginData({
        email: signupData.email,
        password: '',
      });
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoginErrorMessage('');

    if (!loginData.email || !loginData.password) {
      toast.error('Preencha email e senha.');
      return;
    }

    setLoading(true);

    try {
      await base44.auth.signInWithPassword(loginData);
      toast.success('Login realizado com sucesso!');
      window.location.href = '/dashboard';
    } catch (error) {
      const message = error.message?.toLowerCase().includes('email not confirmed')
        ? 'Confirme seu email antes de entrar.'
        : error.message || 'Nao foi possivel entrar.';

      setLoginErrorMessage(message);
      toast.error(error.message || 'Nao foi possivel entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error('Informe seu email para recuperar a senha.');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPasswordForEmail(resetEmail);
      toast.success('Email de recuperacao enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel enviar o email de recuperacao.');
    } finally {
      setLoading(false);
    }
  };

  const renderGuestAuthModeToggle = () => (
    <div className="inline-flex rounded-xl border border-border bg-card/70 p-1">
      <button
        type="button"
        onClick={() => {
          setAuthMode('signup');
          setStep(1);
          setLoginErrorMessage('');
        }}
        className={`px-4 py-2 text-sm rounded-lg transition-colors ${authMode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
      >
        <span className="inline-flex items-center gap-2">
          <UserPlus size={14} />
          Criar conta
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          setAuthMode('login');
          setStep(1);
          setLoginErrorMessage('');
        }}
        className={`px-4 py-2 text-sm rounded-lg transition-colors ${authMode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
      >
        <span className="inline-flex items-center gap-2">
          <LogIn size={14} />
          Entrar
        </span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-10 md:py-20">
      <ParticleBackground />
      <GlowOrb color="primary" size={600} className="-top-40 -left-40 opacity-40" />
      <GlowOrb color="secondary" size={500} className="-bottom-40 -right-40 opacity-30" delay={1.5} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl mx-4"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center -mb-8 md:-mb-16 lg:-mb-24"
          >
            <Logo size="5xl" />
          </motion.div>

          <div className="relative z-20 flex flex-col items-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-black tracking-tighter text-foreground mb-3 leading-none"
            >
              {isGuest
                ? authMode === 'signup' ? 'O PALCO É SEU' : 'BEM-VINDO DE VOLTA'
                : 'QUASE LÁ'
              }
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg md:text-xl font-medium max-w-lg mx-auto mb-8"
            >
              {isGuest
                ? authMode === 'signup'
                  ? 'Conecte-se com a elite da música ao vivo.'
                  : 'Acesse sua conta e gerencie suas vibrações.'
                : 'Personalize sua experiênca na plataforma.'}
            </motion.p>

            <div className="mb-10">
              {isGuest && renderGuestAuthModeToggle()}
            </div>
          </div>
        </div>

        {(!isGuest || authMode === 'signup') && (
          <div className="flex gap-3 mb-12 px-10">
            {[1, 2].map((s) => (
              <div key={s} className="relative flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                {s <= step && (
                  <motion.div
                    layoutId="progress-bar"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isGuest && authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary ml-2">Email</Label>
                  <Input
                    type="email"
                    placeholder="voce@tocamais.app"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginErrorMessage('');
                      setLoginData({ ...loginData, email: e.target.value });
                    }}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-medium px-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary ml-2">Senha</Label>
                  <Input
                    type="password"
                    placeholder="Sua senha secreta"
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginErrorMessage('');
                      setLoginData({ ...loginData, password: e.target.value });
                    }}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-medium px-6"
                  />
                </div>
              </div>

              <div className="flex justify-end px-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <AnimatedButton
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="h-16 rounded-2xl bg-black/40 border border-white/10 text-white font-black text-lg tracking-tight hover:scale-[1.02] transition-all shadow-2xl"
                >
                  {loading ? 'Sincronizando...' : 'ENTRAR NO PALCO'}
                </AnimatedButton>
                {loginErrorMessage && (
                  <p className="text-sm text-destructive text-center font-bold animate-shake">{loginErrorMessage}</p>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-center text-primary mb-8">Selecione sua Jornada</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {roles.map((role) => (
                      <motion.button
                        key={role.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setStep(2);
                        }}
                        className={`group relative w-full p-6 rounded-[2rem] border transition-all duration-500 flex items-center gap-6 text-left overflow-hidden ${selectedRole === role.id
                            ? 'border-primary/50 bg-primary/10 shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]'
                            : 'border-white/5 bg-black/40 backdrop-blur-xl hover:border-white/20'
                          }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${role.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shrink-0 shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-500`}>
                          <role.icon className="w-8 h-8 text-white" />
                        </div>

                        <div className="relative z-10">
                          <p className="text-xl font-heading font-black tracking-tight text-foreground">{role.title}</p>
                          <p className="text-sm text-muted-foreground font-medium">{role.desc}</p>
                        </div>

                        <div className="ml-auto relative z-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500">
                          <ArrowRight className="w-6 h-6 text-primary" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
                >
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-center text-primary mb-4">
                    {isGuest ? 'Últimos Detalhes' : 'Perfil Artístico'}
                  </h2>

                  <div className="space-y-6">
                    {isGuest && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Nome Completo</Label>
                          <Input
                            placeholder="Seu nome artístico ou real"
                            value={signupData.full_name}
                            onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                            className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Email</Label>
                            <Input
                              type="email"
                              placeholder="voce@tocamais.app"
                              value={signupData.email}
                              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                              className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Senha</Label>
                            <Input
                              type="password"
                              placeholder="Crie sua senha"
                              value={signupData.password}
                              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                              className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Cidade</Label>
                        <Input
                          placeholder="Ex: São Paulo"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Estado</Label>
                        <Input
                          placeholder="SP"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">WhatsApp</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium px-6"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Bio / Descrição</Label>
                      <Textarea
                        placeholder="Conte brevemente sua história..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-medium p-6 resize-none"
                      />
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button variant="ghost" onClick={() => setStep(1)} className="h-16 flex-1 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold">
                        Voltar
                      </Button>
                      <AnimatedButton
                        onClick={isGuest ? handleGuestSignup : handleAuthenticatedFinish}
                        disabled={loading}
                        className="h-16 flex-[2] bg-gradient-to-r from-primary to-secondary text-white border-0 font-black text-lg tracking-tight shadow-xl shadow-primary/20"
                      >
                        {loading ? 'Sincronizando...' : isGuest ? 'CRIAR CONTA' : 'FINALIZAR'}
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showForgotPassword && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-card border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight mb-2">RECUPERAR ACESSO</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Enviaremos um link para voce criar uma nova senha.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary ml-2">Seu Email</Label>
                    <Input
                      type="email"
                      placeholder="voce@tocamais.app"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-medium px-6"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <AnimatedButton
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="h-16 rounded-2xl bg-primary text-primary-foreground font-black text-lg tracking-tight"
                    >
                      {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
                    </AnimatedButton>
                    <Button
                      variant="ghost"
                      onClick={() => setShowForgotPassword(false)}
                      disabled={loading}
                      className="h-14 rounded-2xl font-bold"
                    >
                      Voltar para login
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

}
