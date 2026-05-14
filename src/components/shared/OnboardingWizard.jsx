import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Search, Heart, Radio, Trophy, Briefcase, Star, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const clientSteps = [
  { icon: Search, title: "Encontre artistas", description: "Busque por nome, estilo musical ou cidade. Veja quem está ao vivo agora!", gradient: "from-blue-500 to-cyan-400" },
  { icon: Music, title: "Peça músicas e apoie", description: "Envie pedidos e apoie artistas com gorjetas via PIX direto pelo app!", gradient: "from-violet-500 to-purple-400" },
  { icon: Briefcase, title: "Contrate para eventos", description: "Quer um artista no seu evento? Envie uma proposta direto pelo app!", gradient: "from-rose-500 to-pink-400" },
  { icon: Radio, title: "Shows perto de você", description: "Descubra shows ao vivo no radar filtrando pelo seu estilo favorito!", gradient: "from-amber-500 to-orange-400" },
  { icon: Trophy, title: "Ganhe pontos e prêmios", description: "Complete missões, acumule pontos e desbloqueie conquistas!", gradient: "from-emerald-500 to-green-400" },
];

const artistSteps = [
  { icon: Music, title: "Monte seu repertório", description: "Adicione músicas e crie setlists para organizar seus shows.", gradient: "from-blue-500 to-cyan-400" },
  { icon: Radio, title: "Fique ao vivo", description: "Ative o 'Ao Vivo' para que clientes te encontrem e enviem pedidos!", gradient: "from-violet-500 to-purple-400" },
  { icon: Heart, title: "Receba gorjetas", description: "Configure seu PIX e receba gorjetas diretamente dos fãs!", gradient: "from-rose-500 to-pink-400" },
  { icon: Star, title: "Cresça na plataforma", description: "Receba avaliações, suba no ranking e conquiste novos fãs!", gradient: "from-amber-500 to-orange-400" },
];

const establishmentSteps = [
  { icon: Music, title: "Gerencie eventos", description: "Crie eventos com data, horário e artistas para atrair público!", gradient: "from-blue-500 to-cyan-400" },
  { icon: Briefcase, title: "Contrate artistas", description: "Envie propostas direto para artistas da plataforma!", gradient: "from-violet-500 to-purple-400" },
  { icon: Radio, title: "Check-in de artistas", description: "Faça check-in dos artistas tocando no seu local!", gradient: "from-rose-500 to-pink-400" },
  { icon: Star, title: "Destaque-se no radar", description: "Com o PRO, seu local aparece em destaque no radar de shows!", gradient: "from-amber-500 to-orange-400" },
];

export const OnboardingWizard = ({ userType, userName, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = userType === "artista" ? artistSteps : userType === "estabelecimento" ? establishmentSteps : clientSteps;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/95" />
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-30 transition-all duration-700 ease-out"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div className={cn("w-full h-full rounded-full bg-gradient-to-br", step.gradient)} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
        <button
          onClick={onComplete}
          className="absolute -top-12 right-0 text-xs text-white/40 hover:text-white/70 transition-colors font-medium tracking-wide uppercase"
        >
          Pular
        </button>

        <div className="animate-scale-in">
          <div className={cn(
            "w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl mb-8 bg-gradient-to-br",
            step.gradient
          )}>
            <Icon className="w-11 h-11 text-white drop-shadow-lg" strokeWidth={1.8} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          {isFirstStep ? (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Bem-vindo ao Toca+
              <Sparkles className="w-5 h-5 text-amber-400" />
            </span>
          ) : step.title}
        </h2>

        <p className="text-white/60 text-center text-sm leading-relaxed mb-10 max-w-[280px]">
          {isFirstStep
            ? "Veja o que você pode fazer por aqui 👇"
            : step.description}
        </p>

        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-500 ease-out",
                i === currentStep
                  ? "w-8 h-2.5 bg-gradient-to-r " + s.gradient
                  : i < currentStep
                  ? "w-2.5 h-2.5 bg-white/40"
                  : "w-2.5 h-2.5 bg-white/15"
              )}
            />
          ))}
        </div>

        <div className="w-full flex items-center gap-3">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="rounded-full h-12 w-12 text-white/50 hover:text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <Button
            onClick={handleNext}
            className={cn(
              "flex-1 h-12 rounded-full font-semibold text-white shadow-lg transition-all duration-300 bg-gradient-to-r border-0",
              step.gradient,
              "hover:opacity-90"
            )}
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Começar!
              </>
            ) : (
              <>
                {isFirstStep ? "Vamos lá" : "Próximo"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
