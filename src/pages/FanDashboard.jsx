import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Heart, Star, Calendar, Music, ArrowRight } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ArtistCard from '@/components/cards/ArtistCard';
import { Link } from 'react-router-dom';

export default function FanDashboard({ user }) {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user.email],
    queryFn: () => base44.entities.Favorite.filter({ fan_email: user.email }),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', user.email],
    queryFn: () => base44.entities.Review.filter({ fan_email: user.email }),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['topArtists'],
    queryFn: () => base44.entities.ArtistProfile.filter({ is_active: true }, '-avg_rating', 6),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => base44.entities.Event.filter({ status: 'scheduled' }, 'event_date', 5),
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Olá, {user.full_name?.split(' ')[0]} ❤️</h1>
        <p className="text-muted-foreground mt-1">Descubra artistas incríveis e acompanhe seus favoritos</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={Heart} label="Favoritos" value={favorites.length} color="pink" delay={0.1} />
        <StatsCard icon={Star} label="Avaliações" value={reviews.length} color="yellow" delay={0.15} />
        <StatsCard icon={Calendar} label="Próximos Shows" value={events.length} color="primary" delay={0.2} />
      </div>

      {/* Quick Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Link to="/explore" className="block p-6 rounded-xl border border-border bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Explorar Artistas</h3>
                <p className="text-sm text-muted-foreground">Encontre artistas por gênero, localização e mais</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Top Artists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl">Artistas em Destaque</h2>
          <Link to="/explore" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.slice(0, 6).map((a, i) => (
            <ArtistCard key={a.id} artist={a} index={i} />
          ))}
        </div>
        {artists.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum artista cadastrado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}