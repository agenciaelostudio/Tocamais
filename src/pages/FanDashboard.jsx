import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Heart, Star, Calendar, Music, ArrowRight, Sparkles, Wallet, Award, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ArtistCard from '@/components/cards/ArtistCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function FanDashboard({ user }) {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user.email],
    queryFn: () => base44.entities.Favorite.filter({ fan_email: user.email }),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', user.email],
    queryFn: () => base44.entities.Review.filter({ fan_email: user.email }),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tips-given', user.email],
    queryFn: () => base44.entities.Tip.filter({ fan_email: user.email }),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['topArtists'],
    queryFn: () => base44.entities.ArtistProfile.filter({ is_active: true }, '-avg_rating', 6),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => base44.entities.Event.filter({ status: 'scheduled' }, 'event_date', 5),
  });

  const totalTips = tips.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Comunidade Fan</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user.full_name?.split(' ')[0]}</span> ❤️
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed font-medium">
              Sua paixão pela música move a cena. Descubra novos talentos e apoie seus favoritos.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 bg-card/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl shadow-xl">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground">
                  F{i}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center font-black text-[10px] text-white">
                +12
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Fans Ativos</p>
              <p className="text-sm font-bold text-foreground">Conectados agora</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard icon={Wallet} label="Apoio Total" value={`R$ ${totalTips.toLocaleString('pt-BR')}`} color="emerald" delay={0.1} trend="Sua contribuição" />
          <StatsCard icon={Heart} label="Favoritos" value={favorites.length} color="pink" delay={0.15} trend="Sua coleção" />
          <StatsCard icon={Star} label="Avaliações" value={reviews.length} color="yellow" delay={0.2} trend="Sua voz" />
          <StatsCard icon={Award} label="Conquistas" value="Nível 3" color="primary" delay={0.25} trend="Top Doador" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action - Explore */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Link 
              to="/explore" 
              className="group relative block h-full p-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-card/40 to-background border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/40 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/20 transition-all duration-700" />
              
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 rounded-[1.8rem] bg-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <Search className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-heading font-black text-4xl tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                    Explorar Novos <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Talentos</span>
                  </h3>
                  <p className="text-muted-foreground font-medium text-xl max-w-md leading-relaxed">
                    A trilha sonora da sua próxima noite favorita está a um clique de distância.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.2em] text-sm pt-2">
                  Começar Jornada <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Secondary Action - Impact/Wallet */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl shadow-2xl h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="font-black text-lg uppercase tracking-tight">Meu Impacto</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Músicas Pedidas</p>
                    <p className="text-2xl font-black text-foreground">14 Pedidos</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Artistas Apoiados</p>
                    <p className="text-2xl font-black text-foreground">{[...new Set(tips.map(t => t.artist_email))].length} Artistas</p>
                  </div>
                </div>
              </div>
              
              <Link to="/marketplace">
                <Button className="w-full h-14 rounded-2xl bg-foreground text-background font-black mt-6 hover:bg-primary hover:text-white transition-all">
                  Ver Marketplace <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Featured Artists Section */}
        <div className="space-y-8 pt-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                <Sparkles className="text-yellow-400 w-5 h-5" />
              </div>
              <h2 className="font-heading font-black text-3xl tracking-tight uppercase">Top Artistas para <span className="text-secondary">Apoiar</span></h2>
            </div>
            <Link to="/explore" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
              Ver Galeria Completa <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.slice(0, 6).map((a, i) => (
              <ArtistCard key={a.id} artist={a} index={i} />
            ))}
          </div>
          
          {artists.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Music className="w-10 h-10 text-primary opacity-40" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">O palco está vazio</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">Nenhum artista cadastrado no momento. Volte em breve!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}