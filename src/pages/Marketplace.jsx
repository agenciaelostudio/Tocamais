import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Music, Star, Filter, ChevronRight, Users, User, Mic2, LayoutGrid, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';

const FORMAT_ICONS = {
  'Solo': User,
  'Voz e Violão': Mic2,
  'Dupla': Users,
  'Trio': Users,
  'Banda': LayoutGrid,
  'DJ': Music,
};

function ArtistHireCard({ artist, onClick }) {
  const formats = artist.performance_types?.length > 0
    ? artist.performance_types
    : ['Solo', 'Dupla', 'Trio', 'Banda'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -12 }}
      onClick={onClick}
      className="group relative rounded-[3rem] bg-card/30 border border-white/10 backdrop-blur-[30px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:border-primary/40 cursor-pointer"
    >
      {/* Dynamic Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Top Banner / Image Section */}
      <div className="aspect-[16/11] relative overflow-hidden m-4 rounded-[2.2rem] shadow-2xl">
        <motion.img
          src={artist.avatar_url || artist.photo_url || `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600`}
          alt={artist.stage_name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Floating Badges on Image */}
        <div className="absolute top-4 left-4 flex gap-2">
          {artist.avg_rating && (
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-black text-white">{Number(artist.avg_rating).toFixed(1)}</span>
            </div>
          )}
          {artist.is_active && (
            <div className="bg-red-500/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
            </div>
          )}
        </div>

        {/* Price Floating Tag */}
        {artist.base_price > 0 && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-primary/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-2xl transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
               <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] -mb-1">Investimento</p>
               <p className="text-lg font-black text-white tracking-tighter">
                 R$ {Number(artist.base_price).toLocaleString('pt-BR')}
               </p>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="absolute bottom-4 left-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-white/90 tracking-tight drop-shadow-md">{artist.city || 'Brasil'}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-8 pb-8 pt-2 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 opacity-60">
             <Music className="w-3 h-3 text-primary" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Artista Premium</span>
          </div>
          <h3 className="text-3xl font-heading font-black text-foreground tracking-tighter leading-none group-hover:text-primary transition-colors duration-300">
            {artist.stage_name}
          </h3>
        </div>

        {/* Genres Pill-style */}
        <div className="flex gap-2 flex-wrap">
          {artist.genres?.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground group-hover:border-primary/20 group-hover:text-foreground transition-all">
              {g}
            </span>
          ))}
        </div>

        {/* Formats Grid - Sophisticated */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Formatos de Shows</p>
            <div className="h-px flex-1 bg-white/5 ml-4" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {formats.slice(0, 4).map((fmt) => {
              const Icon = FORMAT_ICONS[fmt] || Mic2;
              return (
                <div key={fmt} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group/fmt hover:bg-primary/10 hover:border-primary/20 transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-background/40 flex items-center justify-center shadow-inner group-hover/fmt:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover/fmt:text-foreground">
                    {fmt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced CTA */}
        <div className="pt-2">
          <div className="relative group/cta w-full h-14 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 overflow-hidden transition-all hover:scale-[1.02] active:scale-95">
             <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500" />
             <span className="relative z-10 group-hover/cta:text-white transition-colors">CONTRATAR SHOW</span>
             <ChevronRight className="relative z-10 w-5 h-5 group-hover/cta:translate-x-2 group-hover/cta:text-white transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hire({ user }) {
  const navigate = useNavigate();

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists-for-hire'],
    queryFn: () => base44.entities.ArtistProfile.filter({ is_active: true }, '-avg_rating'),
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      <SEOHead 
        title="Contratar Shows — TocaMais" 
        description="Encontre o formato ideal de show para o seu evento e contrate agora." 
      />
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Contrate seu Show</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground uppercase">
              Contrate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Artistas</span> 🎸
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed font-medium">
              Clique em um artista para ver os formatos disponíveis, preços e vídeos ao vivo.
            </p>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-xl">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Todos os Gêneros</span>
          </div>
        </motion.div>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {isLoading
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-[440px] rounded-[2.5rem] bg-white/5 animate-pulse" />
                ))
              : artists.map((artist) => (
                  <ArtistHireCard
                    key={artist.id}
                    artist={artist}
                    onClick={() => navigate(`/contratar-show/${artist.id}`)}
                  />
                ))
            }
          </AnimatePresence>
        </div>

        {!isLoading && artists.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]"
          >
            <Music className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">Nenhum artista disponível</h3>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
              Em breve novos artistas estarão disponíveis para contratação.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}