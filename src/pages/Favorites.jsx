import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart } from 'lucide-react';
import ArtistCard from '@/components/cards/ArtistCard';

export default function Favorites({ user }) {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user.email],
    queryFn: () => base44.entities.Favorite.filter({ fan_email: user.email }),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['favoriteArtists', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const all = await base44.entities.ArtistProfile.filter({ is_active: true });
      const favIds = favorites.map((f) => f.artist_profile_id);
      return all.filter((a) => favIds.includes(a.id));
    },
    enabled: favorites.length > 0,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Favoritos ❤️</h1>
        <p className="text-muted-foreground mt-1">Seus artistas favoritos</p>
      </motion.div>

      {artists.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum favorito ainda</p>
          <p className="text-sm mt-1">Explore artistas e adicione aos favoritos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((a, i) => (
            <ArtistCard key={a.id} artist={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}