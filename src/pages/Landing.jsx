import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Music, Search, Building2, Radio, Heart, ArrowRight, Star, Zap, Shield, 
  ChevronRight, Play, QrCode, Users, BarChart3, Check, HelpCircle 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import logoTocaMais from "@/assets/logo-tocamais.png";

import slidePedidos from "@/assets/slide-pedidos.jpg";
import slideGorjetas from "@/assets/slide-gorjetas.jpg";
import slideRadar from "@/assets/slide-radar.jpg";
import slideInteracao from "@/assets/slide-interacao.jpg";
import slidePerfis from "@/assets/slide-perfis.jpg";
import tableTent from "@/assets/table-tent.png";
import { motion, AnimatePresence } from "framer-motion";

// Modals - placeholders since they might be missing in target
const PremiumOfferModal = ({ open, onOpenChange }) => null;
const AuthRequiredDialog = ({ open, onOpenChange }) => null;
const EstablishmentPremiumModal = ({ open, onOpenChange }) => null;

const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [pendingRedirect, setPendingRedirect] = useState("/explore");
  const [showEstabPremiumModal, setShowEstabPremiumModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // In the target project, we redirect to / (Dashboard) if logged in
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleContinueFree = () => { setShowPremiumModal(false); navigate("/explore"); };
  const handleSelectPlan = (plan) => {
    setShowPremiumModal(false); setPendingPlan(plan); setPendingRedirect("/explore"); setShowAuthDialog(true);
  };
  const handleEstabContinueFree = () => { setShowEstabPremiumModal(false); navigate("/explore"); };
  const handleEstabSelectPlan = (plan) => {
    setShowEstabPremiumModal(false); setPendingPlan(plan); setPendingRedirect("/explore"); setShowAuthDialog(true);
  };

  const featureSlides = [
    { image: slidePedidos, tag: "Pedidos de Música", title: "Peça a Música que Quiser", desc: "Clientes escolhem o repertório em tempo real. Artistas recebem os pedidos organizados. Bares lotam com o público engajado." },
    { image: slideGorjetas, tag: "Gorjetas via PIX", title: "Apoie Artistas Direto pelo Celular", desc: "Envie gorjetas instantâneas via QR Code. Artistas monetizam cada show. Estabelecimentos atraem mais talentos." },
    { image: slideRadar, tag: "Radar de Shows", title: "Descubra Shows Perto de Você", desc: "Clientes encontram shows ao vivo no mapa. Artistas são descobertos por novos clientes. Bares divulgam eventos automaticamente." },
    { image: slideInteracao, tag: "Votação & Interação", title: "Público Decide a Próxima Música", desc: "Votações ao vivo no telão. Clientes participam ativamente. Artistas conectam com a plateia. Bares criam experiências únicas." },
    { image: slidePerfis, tag: "3 Perfis, 1 Plataforma", title: "Para Artistas, Clientes e Bares", desc: "Artistas gerenciam shows e recebem. Clientes pedem e votam. Estabelecimentos contratam e promovem eventos." },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featureSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featureSlides.length]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-32 md:pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] bg-primary" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[120px] bg-secondary" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" animate="visible" className="max-w-xl">

              <motion.h1 custom={1} variants={fadeIn} className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 uppercase italic">
                O Palco <br />
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary pr-8">
                  é todo seu
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeIn} className="text-lg sm:text-xl leading-relaxed mb-10 text-muted-foreground font-medium">
                Pedidos de música e gorjetas via PIX sem instalar nada, contrate artistas, gestão de agenda de shows, curadoria e gestão musical para bares, tudo pelo celular.
              </motion.p>

              <motion.div custom={3} variants={fadeIn} className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => navigate("/explore")}
                  className="group flex items-center justify-center gap-3 h-16 px-8 rounded-2xl bg-white text-black font-black text-lg transition-all hover:scale-105 active:scale-95"
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate("/explore")}
                  className="group flex items-center justify-center gap-3 h-16 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-lg transition-all backdrop-blur-md"
                >
                  <Search className="w-5 h-5" />
                </button>
              </motion.div>



              <motion.div custom={5} variants={fadeIn} className="flex items-center gap-8 mt-12">
                {[
                  { value: "500+", label: "artistas" },
                  { value: "10k+", label: "pedidos/mês" },
                  { value: "4.9", label: "rating", icon: true },
                ].map((stat, i) => (
                  <div key={i} className={i > 0 ? "border-l border-white/10 pl-8" : ""}>
                    <p className="text-2xl font-black flex items-center gap-1">
                      {stat.value}
                      {stat.icon && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* App Mockup */}
            <div className="hidden lg:flex justify-center items-center relative" style={{ perspective: "1200px" }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  transform: "rotateY(-14deg) rotateX(6deg) rotateZ(-4deg)",
                  transformStyle: "preserve-3d",
                }}
                className="scale-75 xl:scale-100 origin-center"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px] -z-10" />
                <div className="relative animate-[float_4s_ease-in-out_infinite]">
                   {/* 3D Floating Elements */}
                   <motion.div className="absolute -top-10 -right-14 z-30" style={{ transform: "translateZ(80px)" }} animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                     <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                       <Music className="w-8 h-8 text-white" />
                     </div>
                   </motion.div>
                   <motion.div className="absolute -bottom-10 -left-16 z-30" style={{ transform: "translateZ(60px)" }} animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                     <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
                       <span className="text-xl font-black text-white">R$</span>
                     </div>
                   </motion.div>

                  {/* Phone Frame */}
                  <div className="w-[270px] h-[550px] rounded-[3rem] border-[8px] border-[#222] bg-black overflow-hidden shadow-2xl relative z-10">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-black rounded-full z-20" />
                    <div className="h-full w-full bg-gradient-to-b from-[#0f0f1a] to-black flex flex-col items-center justify-center p-6 text-center">
                       <img src={logoTocaMais} alt="Logo" className="h-20 w-auto mb-6" />
                       <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                          <motion.div className="h-full bg-primary" animate={{ width: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sincronizando Show...</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES CAROUSEL ===== */}
      <section id="recursos" className="relative h-[600px] overflow-hidden scroll-mt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featureSlides[currentSlide].image})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 mb-4">
                  {featureSlides[currentSlide].tag}
                </span>
                <h2 className="text-4xl sm:text-6xl font-black uppercase italic mb-4">{featureSlides[currentSlide].title}</h2>
                <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl font-medium">{featureSlides[currentSlide].desc}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-2 mt-8">
              {featureSlides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? "w-12 bg-primary" : "w-4 bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="py-32 px-6 scroll-mt-16">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Experiência Única</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
            Conectando o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ecossistema Musical</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            { icon: Music, badge: "ARTISTA", title: "Sua Carreira no Próximo Nível", desc: "Receba gorjetas PIX, gerencie pedidos em tempo real e acompanhe seu crescimento com métricas profissionais." },
            { icon: Users, badge: "FÃ", title: "Parte do Show", desc: "Peça músicas, envie gorjetas e vote na playlist da noite direto do seu celular, sem baixar nenhum app." },
            { icon: Building2, badge: "BAR", title: "O Palco Ideal", desc: "Contrate talentos, aumente o engajamento do seu público e gerencie sua agenda de shows com facilidade." },
          ].map((item, i) => (
            <div key={i} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block">{item.badge}</span>
              <h3 className="text-2xl font-black mb-4 uppercase italic">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section id="planos" className="py-32 bg-white/5 backdrop-blur-3xl scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">Planos para <span className="text-primary">Evoluir</span></h2>
          <p className="text-muted-foreground text-xl font-medium">Escolha a melhor opção para sua trajetória.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {[
            { name: "GRÁTIS", price: "R$ 0", features: ["QR Code Único", "Pedidos Ilimitados", "Dashboard Básico", "Taxa de 20%"] },
            { name: "ARTISTA PRO", price: "R$ 49,90", popular: true, features: ["100% das Gorjetas", "Destaque no Mapa", "Métricas Avançadas", "Suporte VIP"] },
            { name: "ESTABELECIMENTO", price: "R$ 149,90", features: ["Gestão Musical Completa", "Busca Inteligente por Artistas", "Contratação de Artistas", "Pagamento de Cache", "Curadoria Musical"] },
          ].map((plan, i) => (
            <div key={i} className={`p-12 rounded-[3rem] border ${plan.popular ? "border-primary bg-primary/5 scale-105" : "border-white/10 bg-black/40"} flex flex-col`}>
              <h3 className="text-xl font-black uppercase tracking-widest mb-2">{plan.name}</h3>
              <div className="text-4xl font-black mb-8">{plan.price}<span className="text-sm font-medium text-muted-foreground">/mês</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                    <Check className="w-5 h-5 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${plan.popular ? "bg-primary text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                Selecionar Plano
              </button>
            </div>
          ))}
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <section id="faq" className="py-32 px-6 border-t border-white/5 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">Perguntas <span className="text-primary">Frequentes</span></h2>
            <p className="text-muted-foreground font-medium">Tire suas dúvidas sobre a plataforma.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Como funciona o Toca Mais?", a: "O Toca Mais é uma plataforma que conecta artistas, fãs e estabelecimentos. Através de QR Codes em bares e eventos, os fãs podem pedir músicas, enviar gorjetas via PIX e participar de votações, tudo em tempo real." },
              { q: "Sou artista, como recebo meu cachê?", a: "Os artistas recebem gorjetas diretamente via PIX em suas contas configuradas. Para contratações via plataforma, o pagamento é gerenciado de forma segura, garantindo o recebimento após a realização do show." },
              { q: "O estabelecimento paga alguma taxa?", a: "Temos planos gratuitos e premium para estabelecimentos. No plano gratuito, há uma pequena taxa administrativa sobre as transações. Nos planos premium, o estabelecimento conta com gestão completa de agenda e curadoria musical." },
              { q: "Preciso baixar algum aplicativo?", a: "Não! O Toca Mais funciona diretamente no navegador do celular. Basta escanear o QR Code e você já está conectado ao show, sem precisar instalar nada." },
              { q: "Como faço para pedir uma música?", a: "Ao escanear o QR Code do artista ou do local, você acessa o repertório disponível. Basta escolher a música, confirmar (e opcionalmente adicionar uma gorjeta) e o pedido aparece instantaneamente para o artista." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-6 uppercase italic">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== PHYSICAL EXPERIENCE ===== */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10" />
              <img 
                src={tableTent} 
                alt="Toca Mais no seu bar" 
                className="w-full h-auto drop-shadow-2xl lg:scale-110 origin-left"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8 leading-[0.9]">
                Onde o Digital <br />
                <span className="text-secondary">Encontra o Palco</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Transforme cada mesa em um ponto de interação. Com nossos displays físicos, seus clientes acessam o repertório e fazem pedidos em segundos, sem baixar nada.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Aumento imediato nas gorjetas",
                  "Engajamento total do público",
                  "Gestão simplificada de pedidos",
                  "Experiência premium para o cliente"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold uppercase italic text-sm tracking-widest">
                    <Check className="w-5 h-5 text-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA BANNER ===== */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-primary p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            {/* Decorative circles */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10 max-w-2xl text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                  Toca Mais
                </h3>
              </div>
              <p className="text-white/90 text-lg md:text-xl font-bold leading-tight">
                Um aplicativo criado para conectar os artistas da música ao-vivo com seu público durante o show, para receber pedidos e gorjetas.
              </p>
            </div>

            <button 
              onClick={() => navigate("/explore")}
              className="relative z-10 h-16 px-10 rounded-2xl bg-white text-primary font-black text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
            >
              Fale com a gente
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 border-t border-white/5 text-center">
        <img src={logoTocaMais} alt="Toca Mais" className="h-16 w-auto mx-auto mb-8 opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
          © {new Date().getFullYear()} TOCAMAIS — O Palco é Todo Seu
        </p>
      </footer>
    </div>
  );
};

export default Landing;
