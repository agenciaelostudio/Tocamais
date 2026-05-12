import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Star, MapPin, Music, User, Users, LayoutGrid, Mic2,
  ChevronRight, CheckCircle2, Play, Sparkles,
  ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VerticalVideoPlayer from '@/components/VerticalVideoPlayer';

const FORMAT_CONFIG = {
  'Solo':         { icon: User,      color: 'primary',   label: 'Solo',         mult: 1.0 },
  'Voz e Violão': { icon: Mic2,     color: 'secondary', label: 'Voz e Violão', mult: 1.0 },
  'Dupla':        { icon: Users,     color: 'emerald',   label: 'Dupla',        mult: 1.4 },
  'Trio':         { icon: Users,     color: 'yellow',    label: 'Trio',         mult: 1.8 },
  'Banda':        { icon: LayoutGrid,color: 'pink',      label: 'Banda',        mult: 2.5 },
  'DJ':           { icon: Music,     color: 'purple',    label: 'DJ',           mult: 1.2 },
};

const COLOR_CLASSES = {
  primary:   { bg: 'bg-primary/10',   border: 'border-primary/20',   text: 'text-primary',   pill: 'bg-primary text-white', glow: 'shadow-primary/20' },
  secondary: { bg: 'bg-secondary/10', border: 'border-secondary/20', text: 'text-secondary', pill: 'bg-secondary text-white', glow: 'shadow-secondary/20' },
  emerald:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', pill: 'bg-emerald-500 text-white', glow: 'shadow-emerald-500/20' },
  yellow:    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', pill: 'bg-yellow-500 text-white', glow: 'shadow-yellow-500/20' },
  pink:      { bg: 'bg-pink-500/10',  border: 'border-pink-500/20',  text: 'text-pink-400',  pill: 'bg-pink-500 text-white', glow: 'shadow-pink-500/20' },
  purple:    { bg: 'bg-purple-500/10',border: 'border-purple-500/20',text: 'text-purple-400',pill: 'bg-purple-500 text-white', glow: 'shadow-purple-500/20' },
};

function FormatCard({ format, config, formatData, basePrice, onSelect, isSelected, artistId, navigate }) {
  const Icon = config?.icon || Mic2;
  const colors = COLOR_CLASSES[config?.color || 'primary'];
  const price = formatData?.price || Math.round((basePrice || 800) * (config?.mult || 1));
  const description = formatData?.description || '';
  const videoUrl = formatData?.video_url || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 ${
        isSelected
          ? `${colors.border} bg-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]`
          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      {/* Format header — always visible */}
      <button
        onClick={() => onSelect(format)}
        className="w-full p-8 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-[1.25rem] ${colors.bg} ${colors.border} border flex items-center justify-center transition-all group-hover:scale-110 duration-500 shadow-inner`}>
            <Icon className={`w-8 h-8 ${colors.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <p className="font-heading font-black text-2xl tracking-tight text-foreground">{format}</p>
               {isSelected && <Zap className={`w-4 h-4 ${colors.text} animate-pulse`} />}
            </div>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">Investimento Estimado</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-3xl font-black text-foreground tracking-tighter">R$ {price.toLocaleString('pt-BR')}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
            isSelected ? colors.bg : 'bg-white/5 border border-white/10'
          }`}>
            <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${isSelected ? 'rotate-90 ' + colors.text : 'text-muted-foreground opacity-40'}`} />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 space-y-8 border-t border-white/5 pt-8">
              {/* Price for mobile */}
              <div className="sm:hidden p-6 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                 <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preço do Formato</p>
                 <p className="text-2xl font-black text-foreground">R$ {price.toLocaleString('pt-BR')}</p>
              </div>

              {/* Description */}
              {description ? (
                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Sobre esta configuração</p>
                   <p className="text-lg text-foreground/80 font-medium leading-relaxed">
                     {description}
                   </p>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground font-medium leading-relaxed italic opacity-40">
                  Nenhuma descrição adicional para este formato.
                </p>
              )}

              {/* Video player */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-400">Palco em Ação</p>
                {videoUrl ? (
                  <div className="relative group/video">
                    <div className={`absolute -inset-2 bg-gradient-to-tr from-pink-500/20 to-primary/20 blur-2xl opacity-0 group-hover/video:opacity-100 transition-opacity duration-700`} />
                    <VerticalVideoPlayer url={videoUrl} formatName={format} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12 rounded-[2rem] bg-white/[0.03] border border-dashed border-white/10">
                    <Play className="w-12 h-12 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                      Sem vídeo de demonstração
                    </p>
                  </div>
                )}
              </div>

              {/* Features list (Mocked for premium feel) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-foreground/70">Repertório Personalizável</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-foreground/70">Suporte Técnico Incluso</span>
                 </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Button
                  className={`w-full h-20 rounded-[1.5rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group/cta ${colors.pill} ${colors.glow}`}
                  onClick={() => navigate(`/contratacao/${artistId}?format=${encodeURIComponent(format)}&price=${price}`)}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/cta:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-3">
                    <Send className="w-6 h-6" />
                    SOLICITAR ESTA CONFIGURAÇÃO
                  </div>
                </Button>
                <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
                   <ShieldCheck className="w-3 h-3" />
                   <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.2em] font-black">
                     Contratação Segura via TocaMais
                   </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HireProfile({ user }) {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState(null);

  const { data: artistProfile, isLoading } = useQuery({
    queryKey: ['artistProfile-hire', artistId],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ id: artistId });
      return profiles[0] || null;
    },
    enabled: !!artistId,
  });

  const formats = artistProfile?.performance_types || ['Solo', 'Banda'];
  const showFormatsData = artistProfile?.show_formats || {};

  const handleSelectFormat = (fmt) => {
    setSelectedFormat((prev) => (prev === fmt ? null : fmt));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
           <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
           <Music className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Music className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-3xl font-heading font-black mb-4">Artista não encontrado</h2>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto font-medium">Este palco parece estar vazio no momento. Tente outro artista!</p>
          <Button variant="outline" onClick={() => navigate('/marketplace')} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Explorar Outros
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8">
      {/* Decorative orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse-soft" />

      {/* Sticky back button */}
      <div className="sticky top-0 z-50 bg-background/40 backdrop-blur-3xl border-b border-white/5 px-6 md:px-12 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Contrate Artistas
        </button>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Disponível para Propostas</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 pb-32">
        {/* Artist hero */}
        <div className="relative mb-16 pt-8">
          {/* Cover/Card Container */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[3.5rem] overflow-hidden bg-card/40 border border-white/5 shadow-2xl"
          >
            {/* Cover image area */}
            <div className="h-64 md:h-80 relative">
              {artistProfile.cover_url ? (
                <img
                  src={artistProfile.cover_url}
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                  alt="capa"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card/40 to-secondary/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent" />
              
              {/* Floating Badge Rating */}
              {artistProfile.avg_rating ? (
                <div className="absolute top-6 right-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-2xl">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-black text-white">{artistProfile.avg_rating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            {/* Profile Info Section */}
            <div className="px-8 md:px-12 pb-12 -mt-24 relative z-10">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with massive glow */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[3rem] blur-2xl opacity-50 animate-pulse-soft" />
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] ring-8 ring-card/80 overflow-hidden relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105">
                    {artistProfile.avatar_url ? (
                      <img src={artistProfile.avatar_url} className="w-full h-full object-cover" alt={artistProfile.stage_name} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-5xl font-black text-white">{artistProfile.stage_name?.[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tightest text-foreground">
                      {artistProfile.stage_name}
                    </h1>
                    {artistProfile.city && (
                      <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 w-fit mx-auto">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-muted-foreground">
                          {artistProfile.city}{artistProfile.state && `, ${artistProfile.state}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {artistProfile.genres?.slice(0, 4).map((g) => (
                      <Badge key={g} variant="outline" className="bg-primary/5 border-primary/20 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-xl text-primary">
                        {g}
                      </Badge>
                    ))}
                  </div>

                  {/* Bio */}
                  {artistProfile.bio && (
                    <div className="relative py-6 px-4">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                       <p className="text-foreground/70 font-medium text-lg max-w-lg leading-relaxed mx-auto italic">
                         "{artistProfile.bio}"
                       </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section: Formatos de Show */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Escolha sua Experiência</p>
              </div>
              <h2 className="text-4xl font-heading font-black tracking-tight text-foreground uppercase">
                Formatos de Show
              </h2>
            </div>
            <p className="text-muted-foreground font-medium text-sm max-w-xs md:text-right leading-relaxed">
              Explore as diferentes formas que <span className="text-foreground font-black">{artistProfile.stage_name}</span> pode transformar seu evento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {formats.map((fmt, idx) => {
              const config = FORMAT_CONFIG[fmt] || { icon: Mic2, color: 'primary', mult: 1.0 };
              const formatData = showFormatsData[fmt] || {};
              return (
                <FormatCard
                  key={fmt}
                  format={fmt}
                  config={config}
                  formatData={formatData}
                  basePrice={artistProfile.base_price}
                  onSelect={handleSelectFormat}
                  isSelected={selectedFormat === fmt}
                  artistId={artistId}
                  navigate={navigate}
                />
              );
            })}
          </div>

          {formats.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.02] rounded-[3.5rem] border-2 border-dashed border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="w-10 h-10 text-primary/40 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Palco em Preparação</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
                    Este artista ainda não configurou os formatos de show. Volte em breve para contratar!
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/marketplace')}
                  className="h-12 px-6 rounded-xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  Ver Outros Artistas
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Professionalism info */}
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           transition={{ delay: 0.6 }}
           className="mt-20 p-10 rounded-[3rem] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/10 flex flex-col md:flex-row items-center gap-8 shadow-2xl"
        >
           <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
           </div>
           <div className="text-center md:text-left space-y-2">
              <h4 className="text-xl font-heading font-black tracking-tight text-emerald-400">Padrão TocaMais de Qualidade</h4>
              <p className="text-muted-foreground font-medium text-base leading-relaxed">
                 Todos os artistas nesta plataforma são validados. Sua proposta é protegida por contrato digital e suporte total da nossa equipe.
              </p>
           </div>
        </motion.div>

        {/* Social links */}
        {(artistProfile.social_links?.instagram || artistProfile.social_links?.youtube || artistProfile.social_links?.spotify) ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 pt-12 border-t border-white/5 flex flex-col items-center gap-6"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-40">Mergulhe no Universo Artístico</span>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {artistProfile.social_links?.instagram && (
                <a href={artistProfile.social_links.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-all hover:scale-110">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {artistProfile.social_links?.youtube && (
                <a href={artistProfile.social_links.youtube} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-all hover:scale-110">
                  <Youtube className="w-4 h-4" /> YouTube
                </a>
              )}
              {artistProfile.social_links?.spotify && (
                <a href={artistProfile.social_links.spotify} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all hover:scale-110">
                  <Play className="w-4 h-4" /> Spotify
                </a>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
