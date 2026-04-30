import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Star, MapPin, Music, User, Users, LayoutGrid, Mic2,
  ChevronRight, CheckCircle2, Calendar, DollarSign, Play, Sparkles, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import VerticalVideoPlayer from '@/components/VerticalVideoPlayer';

const FORMAT_CONFIG = {
  'Solo':         { icon: User,      color: 'primary',   label: 'Solo',         mult: 1.0 },
  'Voz e Violão': { icon: Mic2,      color: 'secondary', label: 'Voz e Violão', mult: 1.0 },
  'Dupla':        { icon: Users,     color: 'emerald',   label: 'Dupla',        mult: 1.4 },
  'Trio':         { icon: Users,     color: 'yellow',    label: 'Trio',         mult: 1.8 },
  'Banda':        { icon: LayoutGrid,color: 'pink',      label: 'Banda',        mult: 2.5 },
  'DJ':           { icon: Music,     color: 'purple',    label: 'DJ',           mult: 1.2 },
};

const COLOR_CLASSES = {
  primary:   { bg: 'bg-primary/10',   border: 'border-primary/20',   text: 'text-primary',   pill: 'bg-primary text-white' },
  secondary: { bg: 'bg-secondary/10', border: 'border-secondary/20', text: 'text-secondary', pill: 'bg-secondary text-white' },
  emerald:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', pill: 'bg-emerald-500 text-white' },
  yellow:    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', pill: 'bg-yellow-500 text-white' },
  pink:      { bg: 'bg-pink-500/10',  border: 'border-pink-500/20',  text: 'text-pink-400',  pill: 'bg-pink-500 text-white' },
  purple:    { bg: 'bg-purple-500/10',border: 'border-purple-500/20',text: 'text-purple-400',pill: 'bg-purple-500 text-white' },
};

function FormatCard({ format, config, formatData, basePrice, onSelect, isSelected }) {
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
      className={`rounded-[2rem] border backdrop-blur-xl overflow-hidden transition-all duration-300 ${
        isSelected
          ? `${colors.border} bg-card/60 shadow-2xl`
          : 'border-white/5 bg-card/30 hover:border-white/20'
      }`}
    >
      {/* Format header — always visible */}
      <button
        onClick={() => onSelect(format)}
        className="w-full p-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} ${colors.border} border flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
            <Icon className={`w-7 h-7 ${colors.text}`} />
          </div>
          <div>
            <p className="font-heading font-black text-xl tracking-tight text-foreground">{format}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">A partir de</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-black text-foreground">R$ {price.toLocaleString('pt-BR')}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected ? colors.bg : 'bg-white/5'
          }`}>
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'rotate-90 ' + colors.text : 'text-muted-foreground'}`} />
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">
              {/* Description */}
              {description && (
                <p className="text-base text-muted-foreground font-medium leading-relaxed">
                  {description}
                </p>
              )}

              {/* Video player */}
              {videoUrl && (
                <VerticalVideoPlayer url={videoUrl} formatName={format} />
              )}

              {/* No video state */}
              {!videoUrl && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Play className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    O artista ainda não adicionou um vídeo para este formato.
                  </p>
                </div>
              )}

              {/* CTA */}
              <Button
                className={`w-full h-14 rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] transition-all ${colors.pill}`}
                onClick={() => navigate(`/contratacao/${artistId}?format=${encodeURIComponent(format)}&price=${price}`)}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Solicitar este Show
              </Button>

              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                * Valor final negociado diretamente com o artista
              </p>
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
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center p-8">
        <div>
          <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Artista não encontrado</h2>
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8">
      {/* Decorative orbs */}
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-primary/8 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-secondary/8 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Sticky back button */}
      <div className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Contrate
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 pb-24">
        {/* Artist hero */}
        <div className="relative mb-10">
          {/* Cover */}
          <div className="h-48 md:h-64 rounded-b-[3rem] overflow-hidden relative">
            {artistProfile.cover_url ? (
              <img
                src={artistProfile.cover_url}
                className="w-full h-full object-cover"
                alt="capa"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card/40 to-secondary/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          {/* Artist info overlapping cover */}
          <div className="px-2 -mt-16 relative z-10">
            <div className="flex flex-col items-center text-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[2rem] blur-md opacity-60" />
                <div className="w-32 h-32 rounded-[2rem] ring-4 ring-background overflow-hidden relative z-10 shadow-2xl">
                  {artistProfile.avatar_url ? (
                    <img src={artistProfile.avatar_url} className="w-full h-full object-cover" alt={artistProfile.stage_name} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-4xl font-black text-white">{artistProfile.stage_name?.[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h1 className="text-4xl font-heading font-black tracking-tighter text-foreground">
                    {artistProfile.stage_name}
                  </h1>
                  {artistProfile.city && (
                    <p className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      {artistProfile.city}{artistProfile.state && `, ${artistProfile.state}`}
                    </p>
                  )}
                </div>

                {/* Rating + genres */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {artistProfile.avg_rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-black text-yellow-400">{artistProfile.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {artistProfile.genres?.slice(0, 3).map((g) => (
                    <Badge key={g} variant="outline" className="bg-white/5 border-white/10 text-xs font-bold">
                      {g}
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                {artistProfile.bio && (
                  <p className="text-muted-foreground font-medium text-base max-w-sm leading-relaxed">
                    {artistProfile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Formatos de Show */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Disponível para Contratação</p>
              <h2 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">
                Formatos de Show
              </h2>
            </div>
          </div>

          <p className="text-muted-foreground font-medium text-sm leading-relaxed">
            Clique em um formato para ver detalhes, assistir ao vídeo e fazer sua solicitação.
          </p>

          <div className="space-y-4">
            {formats.map((fmt) => {
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
                />
              );
            })}
          </div>

          {formats.length === 0 && (
            <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <Music className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Este artista ainda não cadastrou formatos de show.</p>
            </div>
          )}
        </motion.div>

        {/* Social links */}
        {(artistProfile.social_links?.instagram || artistProfile.social_links?.youtube) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-4"
          >
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ver mais:</span>
            {artistProfile.social_links?.instagram && (
              <a href={artistProfile.social_links.instagram} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors">
                Instagram
              </a>
            )}
            {artistProfile.social_links?.youtube && (
              <a href={artistProfile.social_links.youtube} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                YouTube
              </a>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
