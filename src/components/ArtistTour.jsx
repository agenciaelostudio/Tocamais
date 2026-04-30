import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Mic2, Users, User, LayoutGrid, Sparkles, Star, Zap, Music, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STEPS = [
  {
    id: 'welcome',
    emoji: '🎸',
    title: 'Bem-vindo ao TocaMais!',
    subtitle: 'Sua vitrine digital para contratantes.',
    description: 'Vamos configurar seu perfil em 4 passos simples. Em menos de 5 minutos, você estará visível para donos de bares e organizadores de eventos em todo o Brasil.',
    color: 'primary',
    icon: Sparkles,
  },
  {
    id: 'photo_bio',
    emoji: '📸',
    title: 'Foto + Sua História',
    subtitle: 'Primeira impressão é a que fica.',
    description: 'Adicione uma **foto profissional** (preferencialmente ao vivo) e escreva uma bio que conte sua trajetória. Perfis com foto recebem **5x mais propostas**.',
    color: 'secondary',
    icon: Star,
    tips: [
      'Use uma foto nítida, bem iluminada',
      'Prefira fotos em palco ou ensaio',
      'Bio de 2-3 frases já é o suficiente',
    ],
  },
  {
    id: 'formats',
    emoji: '🎭',
    title: 'Formatos de Show',
    subtitle: 'Quantas formas você pode se apresentar?',
    description: 'Cadastre todos os formatos que você oferece: Solo, Dupla, Trio, Banda... Cada formato tem seu próprio preço e configuração.',
    color: 'emerald',
    icon: Users,
    formats: ['Solo', 'Dupla', 'Trio', 'Banda', 'DJ', 'Voz e Violão'],
    tips: [
      'Formatos diferentes = mais contratações',
      'Você define o preço de cada formato',
      'Pode adicionar ou remover a qualquer momento',
    ],
  },
  {
    id: 'video',
    emoji: '🎬',
    title: 'Vídeo é tudo!',
    subtitle: 'Mostre seu talento em ação.',
    description: 'Para cada formato, adicione um **link de vídeo vertical** (9:16) filmado ao vivo. Contratantes com vídeo recebem **3x mais propostas**!',
    color: 'pink',
    icon: Zap,
    tips: [
      '📱 Use Instagram Reels, TikTok ou YouTube Shorts',
      '📐 Formato VERTICAL (9:16) — filme na vertical!',
      '🎤 Grave ao vivo, não em estúdio',
      '⏱️ 30 a 60 segundos é o ideal',
      '💡 Iluminação e áudio são essenciais',
    ],
    videoExamples: [
      { platform: 'Instagram Reels', example: 'instagram.com/reel/ABC123', color: 'text-pink-400' },
      { platform: 'TikTok', example: 'tiktok.com/@artista/video/123', color: 'text-foreground' },
      { platform: 'YouTube Shorts', example: 'youtube.com/shorts/ABC123', color: 'text-red-400' },
    ],
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: 'Perfil no Ar!',
    subtitle: 'Você está pronto para ser contratado.',
    description: 'Seu perfil já está visível na plataforma. Donos de bares e produtores podem te encontrar e enviar propostas agora mesmo!',
    color: 'primary',
    icon: CheckCircle2,
    tips: [
      'Responda propostas em até 24h',
      'Mantenha sua agenda atualizada',
      'Adicione vídeos novos regularmente',
    ],
  },
];

const FORMAT_ICONS = { Solo: User, Dupla: Users, Trio: Users, Banda: LayoutGrid, DJ: Music, 'Voz e Violão': Mic2 };

export default function ArtistTour({ profileId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const queryClient = useQueryClient();

  const completeTourMutation = useMutation({
    mutationFn: () => base44.entities.ArtistProfile.update(profileId, { tour_complete: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      onComplete?.();
    },
  });

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const goNext = () => {
    if (isLast) {
      completeTourMutation.mutate();
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  };

  const COLOR_MAP = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
    secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 text-secondary',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-400',
  };

  const colorClasses = COLOR_MAP[step.color] || COLOR_MAP.primary;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/90 backdrop-blur-xl"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-card/80 border border-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden"
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary`} />

        {/* Progress dots */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentStep ? 'w-8 bg-primary' : i < currentStep ? 'w-3 bg-primary/40' : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <div className="absolute top-6 right-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="p-10 pt-16 space-y-8"
          >
            {/* Emoji + Icon */}
            <div className="text-center space-y-4">
              <div className={`w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br ${colorClasses} border flex items-center justify-center shadow-2xl`}>
                <span className="text-5xl">{step.emoji}</span>
              </div>
              <div className="space-y-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${colorClasses.split(' ').find(c => c.startsWith('text-'))}`}>
                  {step.subtitle}
                </p>
                <h2 className="text-3xl font-heading font-black tracking-tighter text-foreground">
                  {step.title}
                </h2>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-base font-medium leading-relaxed text-center max-w-sm mx-auto"
              dangerouslySetInnerHTML={{ __html: step.description.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }}
            />

            {/* Format icons preview */}
            {step.formats && (
              <div className="flex flex-wrap justify-center gap-3">
                {step.formats.map((fmt) => {
                  const Icon = FORMAT_ICONS[fmt] || Mic2;
                  return (
                    <div key={fmt} className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                      <Icon className="w-5 h-5 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fmt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Video platform examples */}
            {step.videoExamples && (
              <div className="space-y-2">
                {step.videoExamples.map((ex) => (
                  <div key={ex.platform} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${ex.color} w-32 shrink-0`}>
                      {ex.platform}
                    </div>
                    <code className="text-[10px] text-muted-foreground font-mono truncate">{ex.example}</code>
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            {step.tips && (
              <div className="space-y-2">
                {step.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-${step.color === 'primary' ? 'primary' : step.color === 'secondary' ? 'secondary' : step.color === 'emerald' ? 'emerald-400' : 'pink-400'}`} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer buttons */}
        <div className="px-10 pb-10 flex gap-3">
          {!isFirst && (
            <Button
              variant="ghost"
              onClick={goPrev}
              className="h-14 px-6 rounded-2xl border border-white/5 hover:bg-white/5 font-black"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={completeTourMutation.isPending}
            className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-base hover:bg-primary/90 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            {isLast ? (
              completeTourMutation.isPending ? 'Iniciando...' : 'Começar! 🚀'
            ) : (
              <span className="flex items-center gap-2">
                Próximo <ChevronRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
