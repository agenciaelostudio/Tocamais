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
import { toast } from 'sonner';

const roles = [
  {
    id: 'bar_owner',
    icon: Beer,
    title: 'Dono de Bar',
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
    title: 'Publico',
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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-10">
      <ParticleBackground />
      <GlowOrb color="primary" size={400} className="-top-20 -left-20" />
      <GlowOrb color="secondary" size={300} className="-bottom-20 -right-20" delay={1.5} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl mx-4"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          {isGuest && renderGuestAuthModeToggle()}
          <p className="text-muted-foreground mt-4">
            {isGuest
              ? authMode === 'signup'
                ? 'Crie sua conta e comece a usar a plataforma sem depender da Base44.'
                : 'Entre na sua conta para continuar.'
              : 'Configure seu perfil para comecar.'}
          </p>
        </div>

        {authError?.type === 'config_missing' && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para usar a autenticacao local.
          </div>
        )}

        {(!isGuest || authMode === 'signup') && (
          <div className="flex gap-2 mb-8 px-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isGuest && authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 bg-card border border-border rounded-xl p-6"
            >
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="voce@tocamais.app"
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginErrorMessage('');
                    setLoginData({ ...loginData, email: e.target.value });
                  }}
                />
              </div>
              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginErrorMessage('');
                    setLoginData({ ...loginData, password: e.target.value });
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <AnimatedButton
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-secondary text-white border-0"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </AnimatedButton>
                {loginErrorMessage && (
                  <p className="text-sm text-destructive">{loginErrorMessage}</p>
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
                >
                  <h2 className="text-xl font-heading font-bold mb-6 text-center">Qual e o seu perfil?</h2>
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <motion.button
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setStep(2);
                        }}
                        className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left ${
                          selectedRole === role.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shrink-0`}>
                          <role.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{role.title}</p>
                          <p className="text-sm text-muted-foreground">{role.desc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
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
                >
                  <h2 className="text-xl font-heading font-bold mb-6 text-center">
                    {isGuest ? 'Crie sua conta' : 'Informacoes basicas'}
                  </h2>
                  <div className="space-y-4 bg-card border border-border rounded-xl p-6">
                    {isGuest && (
                      <>
                        <div>
                          <Label>Nome</Label>
                          <Input
                            placeholder="Seu nome"
                            value={signupData.full_name}
                            onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              placeholder="voce@tocamais.app"
                              value={signupData.email}
                              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Senha</Label>
                            <Input
                              type="password"
                              placeholder="Crie uma senha"
                              value={signupData.password}
                              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          placeholder="Sao Paulo"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input
                          placeholder="SP"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Sobre voce</Label>
                      <Textarea
                        placeholder="Conte um pouco sobre voce..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <AnimatedButton variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Voltar
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={isGuest ? handleGuestSignup : handleAuthenticatedFinish}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary text-white border-0"
                      >
                        {loading ? 'Salvando...' : isGuest ? 'Criar conta' : 'Comecar'}
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
